import "server-only";
import type { Json } from "@/types/database";
import type { SessionUser } from "@/server/auth";
import { createAdminClient } from "@/server/db/supabase";
import { ApiError } from "@/server/http/errors";
import { postProvidersFor, providersFor } from "@/server/social/registry";
import { type Network, ProviderError } from "@/server/social/types";

/** Successful numbers are reused for this long before a background refresh fetches again. */
const FRESH_MS = 12 * 60 * 60 * 1000;
/** Manual "refresh" by the creator: at most once per this window (cost control). */
const MANUAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
/** The daily cron re-checks numbers older than this (≈ weekly refresh for everyone). */
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
/** After a failed attempt, the cron waits this long before retrying. */
const RETRY_MS = 24 * 60 * 60 * 1000;

type SocialRow = { network: Network; handle: string };
type StatsRow = { network: Network; handle: string; fetched_at: string | null; attempted_at: string };

/**
 * Fetch public numbers for each of a creator's social accounts through the provider registry
 * and store them in creator_social_stats (service role; users can't write that table).
 * Safe to call from after(): never throws, failures are recorded on the row.
 */
export async function refreshCreatorSocialStats(creatorId: string, opts: { force?: boolean } = {}) {
  const db = createAdminClient();
  const [{ data: socials }, { data: stats }] = await Promise.all([
    db.from("creator_socials").select("network, handle").eq("creator_id", creatorId),
    db
      .from("creator_social_stats")
      .select("network, handle, fetched_at, attempted_at")
      .eq("creator_id", creatorId),
  ]);
  const current = new Map((stats as StatsRow[] | null)?.map((s) => [s.network, s]) ?? []);

  // Networks the creator removed: drop their numbers.
  const kept = new Set((socials as SocialRow[] | null)?.map((s) => s.network) ?? []);
  const removed = [...current.keys()].filter((n) => !kept.has(n));
  if (removed.length)
    await db.from("creator_social_stats").delete().eq("creator_id", creatorId).in("network", removed);

  const results: Record<string, "updated" | "skipped" | "not_found" | "failed" | "no_provider"> = {};
  for (const social of (socials as SocialRow[] | null) ?? []) {
    const prev = current.get(social.network);
    const sameHandle = prev?.handle.toLowerCase() === social.handle.toLowerCase();
    const fresh =
      sameHandle && prev?.fetched_at && Date.now() - new Date(prev.fetched_at).getTime() < FRESH_MS;
    if (fresh && !opts.force) {
      results[social.network] = "skipped";
      continue;
    }
    const providers = providersFor(social.network);
    if (!providers.length) {
      results[social.network] = "no_provider";
      continue;
    }

    const errors: string[] = [];
    let saved = false;
    for (const provider of providers) {
      try {
        const profile = await provider.fetchProfile(social.handle);
        if (!profile) {
          errors.push(`${provider.id}: not found or private`);
          continue;
        }
        await db.from("creator_social_stats").upsert({
          creator_id: creatorId,
          network: social.network,
          handle: social.handle,
          followers: profile.followers,
          posts: profile.posts,
          avg_views: profile.avg_views,
          avg_likes: profile.avg_likes,
          recent: profile.recent as unknown as Json,
          source: provider.id,
          fetched_at: new Date().toISOString(),
          attempted_at: new Date().toISOString(),
          error: null,
        });
        saved = true;
        break;
      } catch (e) {
        errors.push(e instanceof ProviderError ? e.message : `${provider.id}: ${(e as Error).message}`);
      }
    }
    if (!saved) {
      // Keep the last good numbers only if they belong to the same handle.
      await db.from("creator_social_stats").upsert({
        creator_id: creatorId,
        network: social.network,
        handle: social.handle,
        ...(sameHandle
          ? {}
          : {
              followers: null,
              posts: null,
              avg_views: null,
              avg_likes: null,
              recent: [],
              source: null,
              fetched_at: null,
            }),
        attempted_at: new Date().toISOString(),
        error: errors.join(" | ").slice(0, 1000),
      });
      console.warn(`[social-stats] creator ${creatorId} ${social.network}: ${errors.join(" | ")}`);
    }
    results[social.network] = saved
      ? "updated"
      : errors.every((e) => e.includes("not found"))
        ? "not_found"
        : "failed";
  }
  return results;
}

/** Same, but never throws (for after()). */
export async function refreshCreatorSocialStatsQuietly(creatorId: string) {
  try {
    await refreshCreatorSocialStats(creatorId);
  } catch (e) {
    console.error("[social-stats] refresh failed", e);
  }
}

/** Creator-triggered refresh, rate limited. */
export async function refreshMySocialStats(user: SessionUser, creatorId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("creator_social_stats")
    .select("attempted_at")
    .eq("creator_id", creatorId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data && Date.now() - new Date(data.attempted_at).getTime() < MANUAL_COOLDOWN_MS) {
    throw new ApiError(429, "stats_cooldown", "errors.stats_cooldown");
  }
  void user;
  const socials = await refreshCreatorSocialStats(creatorId, { force: true });
  const portfolio = await refreshCreatorPortfolioStats(creatorId);
  return { socials, portfolio };
}

// ── Portfolio posts (e.g. a Reel link) ──────────────────────────────────────

/** Fetch views/likes/comments for one portfolio item. Never throws. */
export async function refreshPortfolioItemStats(itemId: string) {
  const db = createAdminClient();
  const { data: item } = await db
    .from("portfolio_items")
    .select("id, url, network")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return "missing" as const;
  const providers = postProvidersFor(item.network as Network);
  if (!providers.length) return "no_provider" as const;

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const post = await provider.fetchPost(item.url);
      if (!post) {
        errors.push(`${provider.id}: not found or private`);
        continue;
      }
      await db.from("portfolio_item_stats").upsert({
        portfolio_item_id: item.id,
        ...post,
        source: provider.id,
        fetched_at: new Date().toISOString(),
        attempted_at: new Date().toISOString(),
        error: null,
      });
      return "updated" as const;
    } catch (e) {
      errors.push(e instanceof ProviderError ? e.message : `${provider.id}: ${(e as Error).message}`);
    }
  }
  await db.from("portfolio_item_stats").upsert({
    portfolio_item_id: item.id,
    attempted_at: new Date().toISOString(),
    error: errors.join(" | ").slice(0, 1000),
  });
  console.warn(`[social-stats] portfolio ${item.id}: ${errors.join(" | ")}`);
  return "failed" as const;
}

export async function refreshPortfolioItemStatsQuietly(itemId: string) {
  try {
    await refreshPortfolioItemStats(itemId);
  } catch (e) {
    console.error("[social-stats] portfolio refresh failed", e);
  }
}

async function refreshCreatorPortfolioStats(creatorId: string) {
  const db = createAdminClient();
  const { data: items } = await db.from("portfolio_items").select("id").eq("creator_id", creatorId);
  const out: Record<string, string> = {};
  for (const item of items ?? []) out[item.id] = await refreshPortfolioItemStats(item.id);
  return out;
}

// ── Daily cron: weekly refresh for everyone, within a time budget ──────────

const isStale = (fetched: string | null, attempted: string | null, now: number) =>
  (!fetched || now - new Date(fetched).getTime() > STALE_MS) &&
  (!attempted || now - new Date(attempted).getTime() > RETRY_MS);

/**
 * Re-check everything older than a week (oldest first) until the time budget runs out.
 * The next day's run continues where this one stopped.
 */
export async function refreshStaleStats({ budgetMs }: { budgetMs: number }) {
  const started = Date.now();
  const db = createAdminClient();
  const now = Date.now();

  const [{ data: socials }, { data: stats }, { data: items }, { data: itemStats }] = await Promise.all([
    db.from("creator_socials").select("creator_id, network"),
    db.from("creator_social_stats").select("creator_id, network, fetched_at, attempted_at"),
    db.from("portfolio_items").select("id, network"),
    db.from("portfolio_item_stats").select("portfolio_item_id, fetched_at, attempted_at"),
  ]);

  const statByKey = new Map((stats ?? []).map((s) => [`${s.creator_id}:${s.network}`, s]));
  const staleCreators = new Map<string, number>(); // creator → oldest timestamp
  for (const s of socials ?? []) {
    const st = statByKey.get(`${s.creator_id}:${s.network}`);
    if (!providersFor(s.network as Network).length) continue;
    if (!isStale(st?.fetched_at ?? null, st?.attempted_at ?? null, now)) continue;
    const t = st?.fetched_at ? new Date(st.fetched_at).getTime() : 0;
    staleCreators.set(s.creator_id, Math.min(staleCreators.get(s.creator_id) ?? t, t));
  }
  const itemStatById = new Map((itemStats ?? []).map((s) => [s.portfolio_item_id, s]));
  const staleItems = (items ?? [])
    .filter((i) => postProvidersFor(i.network as Network).length)
    .map((i) => ({ id: i.id, st: itemStatById.get(i.id) }))
    .filter((i) => isStale(i.st?.fetched_at ?? null, i.st?.attempted_at ?? null, now))
    .sort((a, b) => (a.st?.fetched_at ?? "").localeCompare(b.st?.fetched_at ?? ""));

  const queue: (() => Promise<unknown>)[] = [
    ...[...staleCreators.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(
        ([id]) =>
          () =>
            refreshCreatorSocialStats(id, { force: true }),
      ),
    ...staleItems.map((i) => () => refreshPortfolioItemStats(i.id)),
  ];

  let done = 0;
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length && Date.now() - started < budgetMs) {
      const job = queue.shift()!;
      await job().catch((e) => console.error("[social-stats] cron job failed", e));
      done++;
    }
  });
  await Promise.all(workers);
  return { done, remaining: queue.length, creators: staleCreators.size, portfolio: staleItems.length };
}

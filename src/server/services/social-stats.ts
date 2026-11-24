import "server-only";
import type { Json } from "@/types/database";
import type { SessionUser } from "@/server/auth";
import { createAdminClient } from "@/server/db/supabase";
import { ApiError } from "@/server/http/errors";
import { postProvidersFor, providersFor } from "@/server/social/registry";
import { type Network, PostUnavailableError, ProviderError } from "@/server/social/types";
import { type CachedPost, postKey, readPost, readProfile, writePost, writeProfile } from "./social-cache";

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
    // Someone fetched this account in the last hours (another creator, a lookup): reuse it.
    // A forced refresh (manual, weekly cron) always asks the provider.
    const cached = opts.force ? null : await readProfile(social.network, social.handle);
    if (cached) {
      await db.from("creator_social_stats").upsert({
        creator_id: creatorId,
        network: social.network,
        handle: social.handle,
        followers: cached.value.followers,
        posts: cached.value.posts,
        avg_views: cached.value.avg_views,
        avg_likes: cached.value.avg_likes,
        recent: cached.value.recent as unknown as Json,
        source: cached.source,
        fetched_at: cached.fetched_at,
        attempted_at: new Date().toISOString(),
        error: null,
      });
      results[social.network] = "updated";
      continue;
    }
    for (const provider of providers) {
      try {
        const profile = await provider.fetchProfile(social.handle);
        if (!profile) {
          errors.push(`${provider.id}: not found or private`);
          continue;
        }
        await writeProfile(social.network, social.handle, provider.id, profile);
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
/** What a post check found. Only "ok" posts become (or stay) portfolio items with numbers. */
export type PostCheck =
  | { status: "ok"; value: CachedPost; source: string; fetched_at: string }
  | { status: "not_found" | "private" | "not_video" }
  | { status: "unavailable"; error: string };

const isVideo = (p: { media_type?: string | null }) =>
  p.media_type !== "image" && p.media_type !== "carousel";

/**
 * Look a post up (cache first, then providers in order) and say whether it can be a portfolio
 * item. "unavailable" means every provider failed on our side; the caller decides what to do.
 */
export async function checkPost(network: Network, url: string): Promise<PostCheck> {
  const cached = await readPost(network, url);
  if (cached) {
    if (!isVideo(cached.value)) return { status: "not_video" };
    return { status: "ok", ...cached };
  }

  const providers = postProvidersFor(network);
  if (!providers.length) return { status: "unavailable", error: "no provider" };

  const errors: string[] = [];
  let notFound = false;
  for (const provider of providers) {
    try {
      const post = await provider.fetchPost(url);
      if (!post) {
        notFound = true;
        continue;
      }
      const { thumbnail_source, ...numbers } = post;
      const thumbnail_url = thumbnail_source
        ? await storeThumbnail(postKey(network, url), thumbnail_source)
        : null;
      const value: CachedPost = { ...numbers, thumbnail_url };
      const fetched_at = await writePost(network, url, provider.id, value);
      if (!isVideo(value)) return { status: "not_video" };
      return { status: "ok", value, source: provider.id, fetched_at };
    } catch (e) {
      if (e instanceof PostUnavailableError) return { status: e.reason };
      errors.push(e instanceof ProviderError ? e.message : `${provider.id}: ${(e as Error).message}`);
    }
  }
  if (notFound && !errors.length) return { status: "not_found" };
  return { status: "unavailable", error: [...(notFound ? ["not found"] : []), ...errors].join(" | ") };
}

/** The creator's own post: they published it, or are credited on it (Instagram Collab). */
export function ownsPost(post: { owner_handle?: string | null; coauthors?: string[] }, handle: string) {
  const h = handle.toLowerCase();
  return post.owner_handle?.toLowerCase() === h || !!post.coauthors?.includes(h);
}

/** Store a successful check on a portfolio item. */
export async function savePostStats(itemId: string, check: Extract<PostCheck, { status: "ok" }>) {
  // media_type decides the gate; it isn't a column of portfolio_item_stats.
  // media_type and coauthors decide the gates; they aren't columns of portfolio_item_stats.
  const { media_type: _media, coauthors: _co, thumbnail_url, ...numbers } = check.value;
  void _media;
  void _co;
  await createAdminClient()
    .from("portfolio_item_stats")
    .upsert({
      portfolio_item_id: itemId,
      ...numbers,
      // Keep the previous cover when this fetch didn't bring one.
      ...(thumbnail_url ? { thumbnail_url } : {}),
      source: check.source,
      fetched_at: check.fetched_at,
      attempted_at: new Date().toISOString(),
      error: null,
    });
}

export async function refreshPortfolioItemStats(itemId: string) {
  const db = createAdminClient();
  const { data: item } = await db
    .from("portfolio_items")
    .select("id, url, network, creator_id, portfolio_item_stats(owner_handle)")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return "missing" as const;

  // Someone else's post (added before the ownership gate): never sent to the provider again.
  const raw = item.portfolio_item_stats as
    { owner_handle: string | null } | { owner_handle: string | null }[] | null;
  const owner = (Array.isArray(raw) ? raw[0] : raw)?.owner_handle;
  if (owner) {
    const { data: own } = await db
      .from("creator_socials")
      .select("handle")
      .eq("creator_id", item.creator_id)
      .eq("network", item.network)
      .maybeSingle();
    if (own && !ownsPost({ owner_handle: owner }, own.handle)) return "foreign" as const;
  }

  const check = await checkPost(item.network as Network, item.url);
  if (check.status === "ok") {
    await savePostStats(item.id, check);
    return "updated" as const;
  }
  const error = check.status === "unavailable" ? check.error : check.status;
  await db.from("portfolio_item_stats").upsert({
    portfolio_item_id: item.id,
    attempted_at: new Date().toISOString(),
    error: error.slice(0, 1000),
  });
  console.warn(`[social-stats] portfolio ${item.id}: ${error}`);
  return "failed" as const;
}

export async function refreshPortfolioItemStatsQuietly(itemId: string) {
  try {
    await refreshPortfolioItemStats(itemId);
  } catch (e) {
    console.error("[social-stats] portfolio refresh failed", e);
  }
}

const THUMB_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Copy a post's cover into our public "portfolio-thumbs" bucket (provider URLs expire).
 * Returns our URL, or null if the image can't be fetched; never throws.
 */
async function storeThumbnail(key: string, source: string) {
  try {
    const res = await fetch(source, { signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !["image/jpeg", "image/png", "image/webp"].includes(type)) return null;
    const body = await res.arrayBuffer();
    if (body.byteLength > THUMB_MAX_BYTES) return null;
    const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    // One file per post (shared by every portfolio item that links to it).
    const path = `${key.replace(/[^\w-]/g, "-")}.${ext}`;
    const bucket = createAdminClient().storage.from("portfolio-thumbs");
    const { error } = await bucket.upload(path, body, { contentType: type, upsert: true });
    if (error) throw error;
    // Same path on refresh: a version keeps browsers from showing the old cover.
    return `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  } catch (e) {
    console.warn(`[social-stats] thumbnail for ${key} failed`, e);
    return null;
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

// ── "Connect account": synchronous lookup from the profile form ───────────────

/** Paid lookups a user can start per hour (typos and retries included). */
const LOOKUPS_PER_HOUR = 8;

/**
 * Look up a public account right now and return its numbers for the form. If the creator
 * profile already exists, the numbers are also saved as checked stats.
 */
export async function lookupSocial(user: SessionUser, network: Network, handle: string) {
  const db = createAdminClient();

  // Checked recently (by anyone): answer from the cache. Free, so it doesn't count to the limit.
  const cached = await readProfile(network, handle);
  if (cached) {
    const { data: creator } = await db.from("creators").select("id").eq("profile_id", user.id).maybeSingle();
    if (creator) {
      await db.from("creator_social_stats").upsert({
        creator_id: creator.id,
        network,
        handle,
        followers: cached.value.followers,
        posts: cached.value.posts,
        avg_views: cached.value.avg_views,
        avg_likes: cached.value.avg_likes,
        recent: cached.value.recent as unknown as Json,
        source: cached.source,
        fetched_at: cached.fetched_at,
        attempted_at: new Date().toISOString(),
        error: null,
      });
    }
    return {
      network,
      handle,
      followers: cached.value.followers,
      posts: cached.value.posts,
      avg_views: cached.value.avg_views,
      avg_likes: cached.value.avg_likes,
    };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("social_lookups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= LOOKUPS_PER_HOUR) throw new ApiError(429, "lookup_limit", "errors.lookup_limit");

  const providers = providersFor(network);
  if (!providers.length) throw new ApiError(503, "lookup_unavailable", "errors.lookup_unavailable");

  const log = (ok: boolean, source: string | null) =>
    db.from("social_lookups").insert({ user_id: user.id, network, handle, ok, source });

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const profile = await provider.fetchProfile(handle);
      if (!profile || profile.followers == null) {
        errors.push(`${provider.id}: not found or private`);
        continue;
      }
      await log(true, provider.id);
      await writeProfile(network, handle, provider.id, profile);
      const { data: creator } = await db
        .from("creators")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (creator) {
        await db.from("creator_social_stats").upsert({
          creator_id: creator.id,
          network,
          handle,
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
      }
      return {
        network,
        handle,
        followers: profile.followers,
        posts: profile.posts,
        avg_views: profile.avg_views,
        avg_likes: profile.avg_likes,
      };
    } catch (e) {
      errors.push(e instanceof ProviderError ? e.message : `${provider.id}: ${(e as Error).message}`);
    }
  }
  await log(false, null);
  console.warn(`[social-stats] lookup ${network}/${handle}: ${errors.join(" | ")}`);
  if (errors.every((e) => e.includes("not found"))) {
    throw new ApiError(404, "lookup_not_found", "errors.lookup_not_found");
  }
  throw new ApiError(502, "lookup_failed", "errors.lookup_failed");
}

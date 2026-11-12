import "server-only";
import type { Json } from "@/types/database";
import type { SessionUser } from "@/server/auth";
import { createAdminClient } from "@/server/db/supabase";
import { ApiError } from "@/server/http/errors";
import { providersFor } from "@/server/social/registry";
import { type Network, ProviderError } from "@/server/social/types";

/** Successful numbers are reused for this long before a background refresh fetches again. */
const FRESH_MS = 12 * 60 * 60 * 1000;
/** Manual "refresh" by the creator: at most once per this window. */
const MANUAL_COOLDOWN_MS = 60 * 60 * 1000;

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
  return refreshCreatorSocialStats(creatorId, { force: true });
}

import "server-only";
import { serverEnv } from "@/server/env";
import { average, fetchJson, type ProfileStats, type SocialStatsProvider } from "../types";

type ApifyPost = {
  url?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
  videoPlayCount?: number;
  timestamp?: string;
};
type ApifyProfile = {
  username?: string;
  followersCount?: number;
  postsCount?: number;
  private?: boolean;
  latestPosts?: ApifyPost[];
};

/**
 * TEMPORARY third-party fallback until our Meta app is reviewed: Apify's Instagram profile
 * scraper (public profiles only). Gives followers, posts and per-post likes/views.
 * Scraping is outside Instagram's terms and can break without notice — keep it behind the
 * official provider in the registry and remove it once Business Discovery is live.
 * Needs: APIFY_TOKEN (and optionally APIFY_INSTAGRAM_ACTOR).
 */
export const instagramApify: SocialStatsProvider = {
  id: "instagram_apify",
  network: "instagram",
  kind: "third_party",
  isConfigured: () => !!serverEnv.apifyToken,

  async fetchProfile(handle): Promise<ProfileStats | null> {
    const actor = serverEnv.apifyInstagramActor.replace("/", "~");
    const url = new URL(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items`);
    url.searchParams.set("token", serverEnv.apifyToken);
    const items = await fetchJson<ApifyProfile[]>(
      this.id,
      url.toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [handle] }),
      },
      120_000,
    );
    const p = items.find((i) => i.username?.toLowerCase() === handle.toLowerCase()) ?? items[0];
    if (!p || p.private || p.followersCount == null) return null;
    const posts = p.latestPosts ?? [];
    return {
      followers: p.followersCount,
      posts: p.postsCount ?? null,
      avg_views: average(posts.map((x) => x.videoPlayCount ?? x.videoViewCount)),
      avg_likes: average(posts.map((x) => x.likesCount)),
      recent: posts.slice(0, 6).map((x) => ({
        url: x.url ?? null,
        views: x.videoPlayCount ?? x.videoViewCount ?? null,
        likes: x.likesCount ?? null,
        comments: x.commentsCount ?? null,
        posted_at: x.timestamp ?? null,
      })),
    };
  },
};

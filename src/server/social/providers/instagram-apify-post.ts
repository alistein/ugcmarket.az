import "server-only";
import { serverEnv } from "@/server/env";
import { fetchJson, type PostStats, type PostStatsProvider } from "../types";

type ApifyPost = {
  url?: string;
  ownerUsername?: string;
  likesCount?: number;
  commentsCount?: number;
  videoPlayCount?: number;
  /** Deprecated by Instagram; fallback only. */
  videoViewCount?: number;
  timestamp?: string;
  error?: string;
};

/**
 * TEMPORARY third-party: Apify's Instagram Scraper with a direct post/Reel URL.
 * Plays, likes, comments of one public post. Needs APIFY_TOKEN. Remove when an official
 * source (creator-connected Instagram API) is available.
 */
export const instagramApifyPost: PostStatsProvider = {
  id: "instagram_apify_post",
  network: "instagram",
  kind: "third_party",
  isConfigured: () => !!serverEnv.apifyToken,

  async fetchPost(postUrl): Promise<PostStats | null> {
    const url = new URL("https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items");
    url.searchParams.set("token", serverEnv.apifyToken);
    const items = await fetchJson<ApifyPost[]>(
      this.id,
      url.toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directUrls: [postUrl], resultsType: "posts", resultsLimit: 1 }),
      },
      120_000,
    );
    const p = items.find((i) => !i.error);
    if (!p) return null;
    return {
      owner_handle: p.ownerUsername?.toLowerCase() ?? null,
      views: p.videoPlayCount ?? p.videoViewCount ?? null,
      likes: p.likesCount ?? null,
      comments: p.commentsCount ?? null,
      posted_at: p.timestamp ?? null,
    };
  },
};

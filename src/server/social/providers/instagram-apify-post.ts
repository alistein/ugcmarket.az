import "server-only";
import { serverEnv } from "@/server/env";
import { fetchJson, PostUnavailableError, type PostStats, type PostStatsProvider } from "../types";

type ApifyPost = {
  url?: string;
  ownerUsername?: string;
  likesCount?: number;
  commentsCount?: number;
  videoPlayCount?: number;
  /** Deprecated by Instagram; fallback only. */
  videoViewCount?: number;
  timestamp?: string;
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  videoDuration?: number;
  musicInfo?: { artist_name?: string; song_name?: string; uses_original_audio?: boolean };
  paidPartnership?: boolean;
  /** Cover image (Instagram CDN, expires). */
  displayUrl?: string;
  /** Collab posts: the other accounts credited on the post. */
  coauthorProducers?: { username?: string }[];
  /** "Video" (Reels), "Image", "Sidecar" (carousel). */
  type?: string;
  error?: string;
  errorDescription?: string;
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
    if (!p) {
      // Apify answers with an error row: "not_found" for missing/deleted posts; private
      // accounts come back as restricted / private.
      const why = items
        .map((i) => `${i.error ?? ""} ${i.errorDescription ?? ""}`)
        .join(" ")
        .toLowerCase();
      if (/private|restricted|login/.test(why)) throw new PostUnavailableError("private");
      return null;
    }
    return {
      owner_handle: p.ownerUsername?.toLowerCase() ?? null,
      views: p.videoPlayCount ?? p.videoViewCount ?? null,
      likes: p.likesCount ?? null,
      comments: p.commentsCount ?? null,
      posted_at: p.timestamp ?? null,
      thumbnail_source: p.displayUrl ?? null,
      coauthors: (p.coauthorProducers ?? []).flatMap((c) => (c.username ? [c.username.toLowerCase()] : [])),
      media_type:
        p.type === "Video"
          ? "video"
          : p.type === "Image"
            ? "image"
            : p.type === "Sidecar"
              ? "carousel"
              : null,
      caption: p.caption ? p.caption.slice(0, 2200) : null,
      hashtags: (p.hashtags ?? []).slice(0, 30),
      mentions: (p.mentions ?? []).map((m) => m.toLowerCase()).slice(0, 30),
      duration_seconds: p.videoDuration != null ? Math.round(p.videoDuration * 100) / 100 : null,
      music:
        p.musicInfo && !p.musicInfo.uses_original_audio && p.musicInfo.song_name
          ? [p.musicInfo.artist_name, p.musicInfo.song_name].filter(Boolean).join(" · ")
          : null,
      paid_partnership: p.paidPartnership ?? null,
    };
  },
};

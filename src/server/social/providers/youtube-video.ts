import "server-only";
import { serverEnv } from "@/server/env";
import { fetchJson, type PostStats, type PostStatsProvider } from "../types";

type Videos = {
  items?: {
    snippet?: { channelId?: string; publishedAt?: string };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }[];
};
type Channels = { items?: { snippet?: { customUrl?: string } }[] };

/** youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID → ID */
export function youtubeVideoId(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
    return m?.[2] ?? null;
  } catch {
    return null;
  }
}

const num = (v?: string) => (v == null ? null : Number(v));

/** Official YouTube Data API: views/likes/comments of one video. Needs YOUTUBE_API_KEY. */
export const youtubeVideo: PostStatsProvider = {
  id: "youtube_data_api_video",
  network: "youtube",
  kind: "official",
  isConfigured: () => !!serverEnv.youtubeApiKey,

  async fetchPost(postUrl): Promise<PostStats | null> {
    const id = youtubeVideoId(postUrl);
    if (!id) return null;
    const key = serverEnv.youtubeApiKey;
    const v = await fetchJson<Videos>(
      this.id,
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(id)}&key=${key}`,
    );
    const video = v.items?.[0];
    if (!video) return null;
    let owner: string | null = null;
    if (video.snippet?.channelId) {
      const ch = await fetchJson<Channels>(
        this.id,
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${video.snippet.channelId}&key=${key}`,
      );
      owner = ch.items?.[0]?.snippet?.customUrl?.replace(/^@/, "").toLowerCase() ?? null;
    }
    return {
      owner_handle: owner,
      views: num(video.statistics?.viewCount),
      likes: num(video.statistics?.likeCount),
      comments: num(video.statistics?.commentCount),
      posted_at: video.snippet?.publishedAt ?? null,
    };
  },
};

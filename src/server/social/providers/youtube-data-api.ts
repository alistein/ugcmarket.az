import "server-only";
import { serverEnv } from "@/server/env";
import { average, fetchJson, type ProfileStats, type SocialStatsProvider } from "../types";

type Channels = {
  items?: {
    statistics?: { subscriberCount?: string; videoCount?: string; hiddenSubscriberCount?: boolean };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }[];
};
type PlaylistItems = { items?: { contentDetails?: { videoId?: string; videoPublishedAt?: string } }[] };
type Videos = {
  items?: { id: string; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[];
};

const num = (v?: string) => (v == null ? null : Number(v));

/**
 * Official YouTube Data API v3 with an API key: public subscribers and views/likes of the
 * latest uploads. No creator login or review needed. Needs: YOUTUBE_API_KEY.
 */
export const youtubeDataApi: SocialStatsProvider = {
  id: "youtube_data_api",
  network: "youtube",
  kind: "official",
  isConfigured: () => !!serverEnv.youtubeApiKey,

  async fetchProfile(handle): Promise<ProfileStats | null> {
    const key = serverEnv.youtubeApiKey;
    const base = "https://www.googleapis.com/youtube/v3";
    const ch = await fetchJson<Channels>(
      this.id,
      `${base}/channels?part=statistics,contentDetails&forHandle=${encodeURIComponent("@" + handle)}&key=${key}`,
    );
    const channel = ch.items?.[0];
    if (!channel) return null;

    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    let recent: ProfileStats["recent"] = [];
    if (uploads) {
      const pl = await fetchJson<PlaylistItems>(
        this.id,
        `${base}/playlistItems?part=contentDetails&maxResults=10&playlistId=${uploads}&key=${key}`,
      );
      const ids = (pl.items ?? []).map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
      if (ids.length) {
        const v = await fetchJson<Videos>(
          this.id,
          `${base}/videos?part=statistics&id=${ids.join(",")}&key=${key}`,
        );
        const published = new Map(
          (pl.items ?? []).map((i) => [i.contentDetails?.videoId, i.contentDetails?.videoPublishedAt]),
        );
        recent = (v.items ?? []).map((x) => ({
          url: `https://www.youtube.com/watch?v=${x.id}`,
          views: num(x.statistics?.viewCount),
          likes: num(x.statistics?.likeCount),
          comments: num(x.statistics?.commentCount),
          posted_at: published.get(x.id) ?? null,
        }));
      }
    }
    const s = channel.statistics;
    return {
      followers: s?.hiddenSubscriberCount ? null : num(s?.subscriberCount),
      posts: num(s?.videoCount),
      avg_views: average(recent.map((r) => r.views)),
      avg_likes: average(recent.map((r) => r.likes)),
      recent: recent.slice(0, 6),
    };
  },
};

import "server-only";
import { serverEnv } from "@/server/env";
import { average, fetchJson, type ProfileStats, ProviderError, type SocialStatsProvider } from "../types";

type Media = {
  permalink?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
  media_product_type?: string;
};
type Response = {
  business_discovery?: {
    followers_count?: number;
    media_count?: number;
    media?: { data?: Media[] };
  };
};

/**
 * Official Meta Business Discovery: looks up any Business/Creator account by username using
 * OUR Instagram business account. Followers + likes/comments of recent posts (no views).
 * Needs: IG_BUSINESS_ACCOUNT_ID + IG_GRAPH_TOKEN (long-lived), and Meta app review for production.
 * Docs: developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery
 */
export const instagramBusinessDiscovery: SocialStatsProvider = {
  id: "instagram_business_discovery",
  network: "instagram",
  kind: "official",
  isConfigured: () => !!(serverEnv.igBusinessAccountId && serverEnv.igGraphToken),

  async fetchProfile(handle): Promise<ProfileStats | null> {
    const fields = `business_discovery.username(${handle}){followers_count,media_count,media.limit(12){permalink,like_count,comments_count,timestamp,media_product_type}}`;
    const url = new URL(`https://graph.facebook.com/v23.0/${serverEnv.igBusinessAccountId}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", serverEnv.igGraphToken);
    let data: Response;
    try {
      data = await fetchJson<Response>(this.id, url.toString());
    } catch (e) {
      // Personal (non-business) or unknown accounts come back as a 400 from Graph API.
      if (
        e instanceof ProviderError &&
        /HTTP 400/.test(e.message) &&
        /business_discovery|username/i.test(e.message)
      ) {
        return null;
      }
      throw e;
    }
    const bd = data.business_discovery;
    if (!bd) return null;
    const media = bd.media?.data ?? [];
    return {
      followers: bd.followers_count ?? null,
      posts: bd.media_count ?? null,
      avg_views: null,
      avg_likes: average(media.map((m) => m.like_count)),
      recent: media.slice(0, 6).map((m) => ({
        url: m.permalink ?? null,
        views: null,
        likes: m.like_count ?? null,
        comments: m.comments_count ?? null,
        posted_at: m.timestamp ?? null,
      })),
    };
  },
};

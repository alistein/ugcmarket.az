import "server-only";
import { instagramApify } from "./providers/instagram-apify";
import { instagramApifyPost } from "./providers/instagram-apify-post";
import { instagramBusinessDiscovery } from "./providers/instagram-business-discovery";
import { youtubeDataApi } from "./providers/youtube-data-api";
import { youtubeVideo } from "./providers/youtube-video";
import type { Network, PostStatsProvider, SocialStatsProvider } from "./types";

/**
 * Provider order per network = priority. Official APIs first; third-party (scraping) only as
 * a fallback. Unconfigured providers (missing env) are skipped automatically.
 * Priority of networks for the product: Instagram, then TikTok, then YouTube.
 * TODO (wiki: social-stats → Open tasks): merge Business Discovery + Apify field by field.
 */
const PROFILE_PROVIDERS: Record<Network, SocialStatsProvider[]> = {
  instagram: [instagramBusinessDiscovery, instagramApify],
  tiktok: [],
  youtube: [youtubeDataApi],
};

const POST_PROVIDERS: Record<Network, PostStatsProvider[]> = {
  instagram: [instagramApifyPost],
  tiktok: [],
  youtube: [youtubeVideo],
};

export function providersFor(network: Network): SocialStatsProvider[] {
  return PROFILE_PROVIDERS[network].filter((p) => p.isConfigured());
}

export function postProvidersFor(network: Network): PostStatsProvider[] {
  return POST_PROVIDERS[network].filter((p) => p.isConfigured());
}

import "server-only";
import { instagramApify } from "./providers/instagram-apify";
import { instagramBusinessDiscovery } from "./providers/instagram-business-discovery";
import { youtubeDataApi } from "./providers/youtube-data-api";
import type { Network, SocialStatsProvider } from "./types";

/**
 * Provider order per network = priority. Official APIs first; third-party (scraping) only as
 * a fallback. Unconfigured providers (missing env) are skipped automatically.
 * TikTok: add an official Display/Research API provider or a third-party one here.
 */
const PROVIDERS: Record<Network, SocialStatsProvider[]> = {
  instagram: [instagramBusinessDiscovery, instagramApify],
  tiktok: [],
  youtube: [youtubeDataApi],
};

export function providersFor(network: Network): SocialStatsProvider[] {
  return PROVIDERS[network].filter((p) => p.isConfigured());
}

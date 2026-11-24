import "server-only";

export type Network = "instagram" | "tiktok" | "youtube";

export type RecentPost = {
  url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
};

/** What every provider returns for a public profile. Unknown values are null, never guessed. */
export type ProfileStats = {
  followers: number | null;
  posts: number | null;
  avg_views: number | null;
  avg_likes: number | null;
  recent: RecentPost[];
};

/**
 * A source of public social numbers. Providers are tried in registry order per network:
 * official APIs first, third-party data providers (scraping) as a temporary fallback.
 * Add a provider: implement this, register it in registry.ts, add its env vars.
 */
export interface SocialStatsProvider {
  /** Stored in creator_social_stats.source, e.g. "instagram_business_discovery". */
  id: string;
  network: Network;
  /** official = platform API within its terms; third_party = data vendor / scraping (temporary). */
  kind: "official" | "third_party";
  /** False when its env vars are missing; the registry skips it. */
  isConfigured(): boolean;
  /** null = the account doesn't exist or isn't public. Throw ProviderError on failures. */
  fetchProfile(handle: string): Promise<ProfileStats | null>;
}

/** Numbers for one post (a Reel, TikTok video, YouTube video) by its URL. */
export type PostStats = {
  /** Account that published it, lowercased, without @. */
  owner_handle: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
  caption?: string | null;
  hashtags?: string[];
  /** Accounts tagged in the post, without @. */
  mentions?: string[];
  duration_seconds?: number | null;
  /** "Artist · Song", or null for original audio. */
  music?: string | null;
  paid_partnership?: boolean | null;
  /** The provider's cover image URL (often short-lived). The service copies it into our storage. */
  thumbnail_source: string | null;
};

/** Same idea as SocialStatsProvider, for a single post URL. */
export interface PostStatsProvider {
  id: string;
  network: Network;
  kind: "official" | "third_party";
  isConfigured(): boolean;
  /** null = post not found, private or deleted. */
  fetchPost(url: string): Promise<PostStats | null>;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`${provider}: ${message}`);
  }
}

/** Averages over posts that actually report the metric. */
export function average(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

export async function fetchJson<T>(
  provider: string,
  url: string,
  init?: RequestInit,
  timeoutMs = 25_000,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch (e) {
    throw new ProviderError(provider, `network: ${(e as Error).message}`);
  }
  if (!res.ok) throw new ProviderError(provider, `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

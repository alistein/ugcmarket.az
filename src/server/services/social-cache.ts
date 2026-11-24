import "server-only";
import type { Json } from "@/types/database";
import { createAdminClient } from "@/server/db/supabase";
import type { Network, PostStats, ProfileStats } from "@/server/social/types";

/**
 * Provider results shared by what was fetched (an account, a post), not by who asked.
 * Every paid fetch writes here; reads reuse anything younger than CACHE_MS.
 */
export const CACHE_MS = 12 * 60 * 60 * 1000;

type Kind = "profile" | "post";

export { postKey, profileKey } from "@/server/social/keys";
import { postKey, profileKey } from "@/server/social/keys";

async function read<T>(kind: Kind, key: string) {
  const { data } = await createAdminClient()
    .from("social_cache")
    .select("source, data, fetched_at")
    .eq("kind", kind)
    .eq("key", key)
    .maybeSingle();
  if (!data || Date.now() - new Date(data.fetched_at).getTime() > CACHE_MS) return null;
  return { source: data.source, value: data.data as unknown as T, fetched_at: data.fetched_at };
}

async function write(kind: Kind, key: string, source: string, value: unknown) {
  const fetched_at = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("social_cache")
    .upsert({ kind, key, source, data: value as Json, fetched_at });
  if (error) console.warn(`[social-cache] write ${kind} ${key} failed`, error.message);
  return fetched_at;
}

export const readProfile = (network: Network, handle: string) =>
  read<ProfileStats>("profile", profileKey(network, handle));
export const writeProfile = (network: Network, handle: string, source: string, value: ProfileStats) =>
  write("profile", profileKey(network, handle), source, value);

/** Cached post: the numbers plus our stored cover URL (never the provider's expiring one). */
export type CachedPost = Omit<PostStats, "thumbnail_source"> & { thumbnail_url: string | null };
export const readPost = (network: Network, url: string) => read<CachedPost>("post", postKey(network, url));
export const writePost = (network: Network, url: string, source: string, value: CachedPost) =>
  write("post", postKey(network, url), source, value);

"use client";

import { queryOptions, useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "@/features/me/hooks";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import {
  type CreatorProfileInput,
  type CreatorProfileUpdate,
  isEnabledNetwork,
  type PortfolioItemInput,
} from "@/schemas";

export const creatorKeys = {
  /** Prefix: every public profile. */
  publics: ["creators", "public"] as const,
  public: (handle: string) => ["creators", "public", handle] as const,
  mine: ["creators", "mine"] as const,
  handle: (handle: string) => ["creators", "handle", handle] as const,
  /** A creator's contacts as revealed to one brand (viewer in the key: it depends on who asks). */
  contacts: (handle: string, viewerId: string) => ["creators", "contacts", handle, viewerId] as const,
  /** Mutation key: lets the portfolio grid show a tile for each link still being checked. */
  addPortfolio: ["creators", "portfolio", "add"] as const,
  /** Background account lookup during setup, one per username. */
  lookup: (network: Network, handle: string) => ["creators", "lookup", network, handle] as const,
};

export type Network = "instagram" | "tiktok" | "youtube";

export type CreatorPublic = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  gender: "female" | "male" | null;
  birth_year: number | null;
  city: string;
  country: string;
  categories: string[];
  languages: string[];
  bio: string | null;
  paid_open: boolean;
  barter_open: boolean;
  /** "Kollaborasiya" in copy. */
  repost_open: boolean;
  lifestyle_tags: string[];
  shoot_options: string[];
  skills: string[];
  review_status: "pending" | "approved" | "rejected";
  created_at: string;
  creator_socials: {
    network: Network;
    handle: string;
    followers: number;
    avg_views: number | null;
    verified: boolean;
  }[];
  /** Numbers checked automatically by the server (src/server/social). */
  creator_social_stats?: SocialStats[];
  creator_prices: { format: string; amount: number; currency: string }[];
  portfolio_items: {
    id: string;
    url: string;
    network: Network;
    title: string | null;
    position: number;
    /** Checked automatically for the post itself (views/likes). One-to-one; PostgREST may return an array. */
    portfolio_item_stats?: PostStats | PostStats[] | null;
  }[];
};

export type PostStats = {
  owner_handle: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
  fetched_at: string | null;
  /** Cover image copied into our storage (portfolio-thumbs). */
  thumbnail_url?: string | null;
  caption?: string | null;
  hashtags?: string[];
  mentions?: string[];
  duration_seconds?: number | null;
  music?: string | null;
  paid_partnership?: boolean | null;
};

/** The post's cover, if the server has fetched one. Shown whoever posted it (it's the creator's link). */
export function postCover(item: CreatorPublic["portfolio_items"][number]) {
  const raw = item.portfolio_item_stats;
  const st = Array.isArray(raw) ? raw[0] : raw;
  return st?.thumbnail_url ?? null;
}

/**
 * Checked numbers for a portfolio post, shown only when the post was published by the
 * creator's own account on that network (stops borrowing someone else's viral Reel).
 */
export function postNumbers(
  c: Pick<CreatorPublic, "creator_socials">,
  item: CreatorPublic["portfolio_items"][number],
) {
  const raw = item.portfolio_item_stats;
  const st = Array.isArray(raw) ? raw[0] : raw;
  if (!st?.fetched_at) return null;
  const own = c.creator_socials.find((s) => s.network === item.network)?.handle.toLowerCase();
  if (!own || st.owner_handle?.toLowerCase() !== own) return null;
  return st;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Portfolio at a glance for brands, from the creator's own checked posts only (the same rule as
 * the tiles). Median views is the headline: one viral Reel can't inflate it the way an average
 * would. null when no post has checked numbers yet.
 */
export function portfolioSummary(c: Pick<CreatorPublic, "creator_socials" | "portfolio_items">) {
  const posts = c.portfolio_items.flatMap((item) => {
    const n = postNumbers(c, item);
    return n?.views != null ? [n as PostStats & { views: number }] : [];
  });
  if (!posts.length) return null;
  const views = posts.map((p) => p.views);
  const rates = posts
    .filter((p) => p.views > 0 && (p.likes != null || p.comments != null))
    .map((p) => (((p.likes ?? 0) + (p.comments ?? 0)) / p.views) * 100);
  return {
    count: posts.length,
    medianViews: Math.round(median(views)),
    totalViews: views.reduce((a, b) => a + b, 0),
    bestViews: Math.max(...views),
    /** Average engagement rate in %, over posts that report likes or comments. */
    er: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
  };
}

export type SocialStats = {
  network: Network;
  handle: string;
  followers: number | null;
  posts: number | null;
  avg_views: number | null;
  avg_likes: number | null;
  source: string | null;
  fetched_at: string | null;
};

/**
 * Numbers to show for one social account: automatically checked ones when they exist for the
 * same handle, otherwise what the creator entered (self-reported).
 */
export function socialNumbers(
  c: Pick<CreatorPublic, "creator_social_stats">,
  s: CreatorPublic["creator_socials"][number],
) {
  const st = c.creator_social_stats?.find(
    (x) =>
      x.network === s.network &&
      x.handle.toLowerCase() === s.handle.toLowerCase() &&
      x.fetched_at &&
      x.followers != null,
  );
  return st
    ? {
        followers: st.followers ?? s.followers,
        avg_views: st.avg_views ?? s.avg_views,
        avg_likes: st.avg_likes,
        checked: true,
        checked_at: st.fetched_at,
      }
    : { followers: s.followers, avg_views: s.avg_views, avg_likes: null, checked: false, checked_at: null };
}

export type LookupResult = {
  network: Network;
  handle: string;
  followers: number;
  posts: number | null;
  avg_views: number | null;
  avg_likes: number | null;
};

/** "Connect account": fetch public numbers for a username now (server rate-limits; paid). */
export function useLookupSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { network: Network; handle: string }) =>
      api<LookupResult>("/creators/socials/lookup", { method: "POST", json: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorKeys.mine }),
  });
}

/**
 * Setup: look the account up as soon as the creator leaves the socials step, while they fill the
 * last one. The server stores the result in the shared cache, so "Profili yarat" finds it there.
 * Nothing on screen reads it; errors (not found, limit) are left for the profile to show.
 */
export const socialLookupQuery = (network: Network, handle: string) =>
  queryOptions({
    queryKey: creatorKeys.lookup(network, handle),
    queryFn: () =>
      api<LookupResult>("/creators/socials/lookup", { method: "POST", json: { network, handle } }),
    // Paid and rate limited: one try per username, never again on focus, mount or reconnect.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

export function useSocialPrefetch(network: Network, handle: string | null) {
  return useQuery({ ...socialLookupQuery(network, handle ?? ""), enabled: !!handle });
}

export function useRefreshSocialStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<Record<string, string>>("/creators/me/socials/refresh", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorKeys.mine }),
  });
}

export type MyCreator = CreatorPublic & { contact_instagram: string | null; contact_phone: string | null };

/**
 * Hide networks that aren't live yet (ENABLED_NETWORKS) from every screen, even if older
 * rows exist. Apply right after fetching.
 */
export function onlyEnabledNetworks<T extends CreatorPublic>(c: T): T {
  return {
    ...c,
    creator_socials: c.creator_socials.filter((s) => isEnabledNetwork(s.network)),
    creator_social_stats: c.creator_social_stats?.filter((s) => isEnabledNetwork(s.network)),
    portfolio_items: c.portfolio_items.filter((p) => isEnabledNetwork(p.network)),
  };
}

export function usePublicCreator(handle: string) {
  return useQuery({
    queryKey: creatorKeys.public(handle),
    queryFn: () => api<CreatorPublic>(`/creators/${handle}`).then(onlyEnabledNetworks),
  });
}

/** null = signed-in creator who hasn't set up a profile yet. */
export function useMyCreator(enabled = true) {
  return useQuery({
    queryKey: creatorKeys.mine,
    queryFn: () => api<MyCreator | null>("/creators/me").then((c) => (c ? onlyEnabledNetworks(c) : c)),
    enabled,
  });
}

export function useHandleAvailability(handle: string, enabled: boolean) {
  return useQuery({
    queryKey: creatorKeys.handle(handle),
    queryFn: () =>
      api<{ handle: string; available: boolean }>(
        `/creators/handle-available?handle=${encodeURIComponent(handle)}`,
      ),
    enabled,
    staleTime: 10_000,
    retry: false,
  });
}

export function useInvalidateMine() {
  const qc = useQueryClient();
  return (data?: MyCreator) => {
    if (data) qc.setQueryData(creatorKeys.mine, data);
    // Returned so the mutation waits: screens navigate in onSuccess and must read a fresh `me`.
    return Promise.all([
      qc.invalidateQueries({ queryKey: creatorKeys.mine }),
      qc.invalidateQueries({ queryKey: meKeys.all }),
      qc.invalidateQueries({ queryKey: creatorKeys.publics }),
    ]);
  };
}

/**
 * No cache update here on purpose: the setup form swaps to the editor as soon as the profile is
 * in the cache, which would unmount it before it can navigate. The caller navigates first, then
 * calls useInvalidateMine() with the new profile.
 */
export function useCreateCreator() {
  return useMutation({
    mutationFn: (input: CreatorProfileInput) => api<MyCreator>("/creators", { method: "POST", json: input }),
  });
}

export function useUpdateCreator() {
  const done = useInvalidateMine();
  return useMutation({
    mutationFn: (input: CreatorProfileUpdate) =>
      api<MyCreator>("/creators/me", { method: "PATCH", json: input }),
    onSuccess: done,
  });
}

export function useAddPortfolioItem() {
  const done = useInvalidateMine();
  return useMutation({
    mutationKey: creatorKeys.addPortfolio,
    mutationFn: (input: PortfolioItemInput) =>
      api<unknown>("/creators/me/portfolio", { method: "POST", json: input }),
    onSuccess: () => done(),
  });
}

/** Links being added right now (the check can take up to a minute): one pending tile each. */
export function usePendingPortfolioUrls() {
  return useMutationState({
    filters: { mutationKey: creatorKeys.addPortfolio, status: "pending" },
    select: (m) => (m.state.variables as PortfolioItemInput | undefined)?.url ?? "",
  });
}

export function useRemovePortfolioItem() {
  const done = useInvalidateMine();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/creators/me/portfolio/${id}`, { method: "DELETE" }),
    onSuccess: () => done(),
  });
}

/**
 * Avatar: resize to a 512px WebP in the browser (phones send 4–12 MB photos), get a signed
 * upload URL from /api, upload straight to Storage, return the public URL.
 */
/** Square WebP upload to the avatars (creators) or logos (brands) bucket → public URL. */
export function useUploadAvatar(kind: "avatar" | "logo" = "avatar") {
  return useMutation({
    mutationFn: async ({ file, area }: { file: File; area?: CropArea }) => {
      if (!file.type.startsWith("image/")) throw new Error("avatar_type");
      const blob = await resizeToWebp(file, 512, area);
      const signed = await api<{ bucket: string; path: string; token: string }>("/uploads/sign", {
        method: "POST",
        json: { kind, ext: "webp" },
      });
      const storage = createClient().storage.from(signed.bucket);
      const { error } = await storage.uploadToSignedUrl(signed.path, signed.token, blob, {
        contentType: "image/webp",
      });
      if (error) throw error;
      return storage.getPublicUrl(signed.path).data.publicUrl;
    },
  });
}

/** Crop rectangle in source-image pixels (react-easy-crop's croppedAreaPixels). */
export type CropArea = { x: number; y: number; width: number; height: number };

async function resizeToWebp(file: File, size: number, area?: CropArea): Promise<Blob> {
  // Respect EXIF rotation from phone cameras (matches what the cropper showed).
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  // The chosen crop, or a centered square when none was given.
  const side = Math.min(bitmap.width, bitmap.height);
  const src = area ?? {
    x: (bitmap.width - side) / 2,
    y: (bitmap.height - side) / 2,
    width: side,
    height: side,
  };
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.round(Math.min(size, src.width));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("avatar_type");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, src.x, src.y, src.width, src.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error("avatar_type");
  return blob;
}

export type CreatorContacts = { instagram: string | null; phone: string | null; email: string | null };

/** Phone, email and Instagram for a signed-in brand; fetched only when the popup opens. */
export function useCreatorContacts(handle: string, viewerId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: creatorKeys.contacts(handle, viewerId ?? ""),
    queryFn: () => api<CreatorContacts>(`/creators/${encodeURIComponent(handle)}/contacts`),
    enabled: enabled && !!viewerId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

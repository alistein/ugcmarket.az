"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "@/features/me/hooks";
import { api } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import type { CreatorProfileInput, CreatorProfileUpdate, PortfolioItemInput } from "@/schemas";

export const creatorKeys = {
  public: (handle: string) => ["creators", "public", handle] as const,
  mine: ["creators", "mine"] as const,
  handle: (handle: string) => ["creators", "handle", handle] as const,
};

export type Network = "instagram" | "tiktok" | "youtube";

export type CreatorPublic = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  country: string;
  categories: string[];
  languages: string[];
  bio: string | null;
  barter_open: boolean;
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
  portfolio_items: { id: string; url: string; network: Network; title: string | null; position: number }[];
};

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

export function useRefreshSocialStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<Record<string, string>>("/creators/me/socials/refresh", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorKeys.mine }),
  });
}

export type MyCreator = CreatorPublic & { contact_instagram: string | null; contact_phone: string | null };

export function usePublicCreator(handle: string) {
  return useQuery({
    queryKey: creatorKeys.public(handle),
    queryFn: () => api<CreatorPublic>(`/creators/${handle}`),
  });
}

/** null = signed-in creator who hasn't set up a profile yet. */
export function useMyCreator(enabled = true) {
  return useQuery({
    queryKey: creatorKeys.mine,
    queryFn: () => api<MyCreator | null>("/creators/me"),
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

function useInvalidateMine() {
  const qc = useQueryClient();
  return (data?: MyCreator) => {
    if (data) qc.setQueryData(creatorKeys.mine, data);
    void qc.invalidateQueries({ queryKey: creatorKeys.mine });
    void qc.invalidateQueries({ queryKey: meKeys.all });
    void qc.invalidateQueries({ queryKey: ["creators", "public"] });
  };
}

export function useCreateCreator() {
  const done = useInvalidateMine();
  return useMutation({
    mutationFn: (input: CreatorProfileInput) => api<MyCreator>("/creators", { method: "POST", json: input }),
    onSuccess: done,
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
    mutationFn: (input: PortfolioItemInput) =>
      api<unknown>("/creators/me/portfolio", { method: "POST", json: input }),
    onSuccess: () => done(),
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
export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ file, area }: { file: File; area?: CropArea }) => {
      if (!file.type.startsWith("image/")) throw new Error("avatar_type");
      const blob = await resizeToWebp(file, 512, area);
      const signed = await api<{ bucket: string; path: string; token: string }>("/uploads/sign", {
        method: "POST",
        json: { kind: "avatar", ext: "webp" },
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

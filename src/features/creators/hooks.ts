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
  creator_prices: { format: string; amount: number; currency: string }[];
  portfolio_items: { id: string; url: string; network: Network; title: string | null; position: number }[];
};

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
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("image/")) throw new Error("avatar_type");
      const blob = await resizeToWebp(file, 512);
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

async function resizeToWebp(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  // Center-crop to a square, then scale down.
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(size, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("avatar_type");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error("avatar_type");
  return blob;
}

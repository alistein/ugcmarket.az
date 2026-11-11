"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import type { CreatorProfileInput, CreatorProfileUpdate, PortfolioItemInput } from "@/schemas";

export const creatorKeys = {
  public: (handle: string) => ["creators", "public", handle] as const,
  mine: ["creators", "mine"] as const,
};

export function usePublicCreator(handle: string) {
  return useQuery({ queryKey: creatorKeys.public(handle), queryFn: () => api<CreatorPublic>(`/creators/${handle}`) });
}

export function useMyCreator() {
  return useQuery({ queryKey: creatorKeys.mine, queryFn: () => api<unknown>("/creators/me") });
}

export function useCreateCreator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatorProfileInput) =>
      api<{ id: string; handle: string }>("/creators", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useUpdateCreator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof CreatorProfileUpdate>) =>
      api<unknown>("/creators/me", { method: "PATCH", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorKeys.mine }),
  });
}

export function useAddPortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof PortfolioItemInput>) =>
      api<unknown>("/creators/me/portfolio", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorKeys.mine }),
  });
}

export type CreatorPublic = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  categories: string[];
  languages: string[];
  bio: string | null;
  barter_open: boolean;
  creator_socials: { network: string; handle: string; followers: number; avg_views: number | null; verified: boolean }[];
  creator_prices: { format: string; amount: number; currency: string }[];
  portfolio_items: { id: string; url: string; network: string; title: string | null }[];
};

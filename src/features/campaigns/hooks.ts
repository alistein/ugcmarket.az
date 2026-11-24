"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { ApiClientError, api } from "@/lib/api-client";
import type { CampaignDraft, CampaignFilters, CampaignStatusChange, Deliverable } from "@/schemas";

export const campaignKeys = {
  board: (f: Partial<CampaignFilters>) => ["campaigns", "board", f] as const,
  detail: (id: string) => ["campaigns", "detail", id] as const,
  mine: ["campaigns", "mine"] as const,
};

function toQuery(f: Partial<CampaignFilters>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useCampaignBoard(filters: Partial<CampaignFilters>) {
  return useQuery({
    queryKey: campaignKeys.board(filters),
    queryFn: () =>
      api<{ items: CampaignCard[]; total: number; page: number; page_size: number }>(
        `/campaigns${toQuery(filters)}`,
      ),
  });
}

/** Pay is hidden from signed-out visitors, so the cache is split by signed-in state. */
export function useCampaign(id: string, signedIn = false) {
  return useQuery({
    queryKey: [...campaignKeys.detail(id), signedIn ? "in" : "out"],
    queryFn: () => api<CampaignDetail>(`/campaigns/${id}`),
    // A 404 means "not published" (or gone): don't retry, the owner preview takes over.
    retry: (n, e) => !(e instanceof ApiClientError && e.status === 404) && n < 2,
  });
}

export type CampaignStatusValue = "draft" | "pending_review" | "published" | "paused" | "closed" | "rejected";

/** A brand's own listing, any status, with its application count. */
export type MyCampaign = {
  id: string;
  /** null only on drafts (they can be saved half-filled). */
  title: string | null;
  status: CampaignStatusValue;
  /** What the listing asks for: [{ format: "reels", count: 3 }, …]. */
  deliverables: Deliverable[];
  compensation_type: string;
  compensation_value: number | null;
  currency: string;
  deadline: string | null;
  created_at: string;
  published_at: string | null;
  /** Set when the brand archived it (hidden from the main list, status unchanged). */
  archived_at: string | null;
  compensation_details: string | null;
  city: string | null;
  applications: { count: number }[];
  /** Newest three applicants (for the avatar stack). */
  recent_applicants: { creator: { display_name: string; avatar_url: string | null } | null }[];
};

export function useMyCampaigns(enabled = true) {
  return useQuery({
    queryKey: campaignKeys.mine,
    queryFn: () => api<MyCampaign[]>("/campaigns/mine"),
    enabled,
  });
}

export function useDuplicateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ id: string }>(`/campaigns/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.mine }),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CampaignDraft) =>
      api<{ id: string; status: string }>("/campaigns", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.mine }),
  });
}

/** Status change for any own listing (the id comes with the call, e.g. right after create). */
export function useSetCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string } & z.infer<typeof CampaignStatusChange>) =>
      api<{ id: string; status: string }>(`/campaigns/${id}/status`, { method: "POST", json: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

/** Archive a finished listing, or restore it (the status stays as it was). */
export function useArchiveCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api<{ id: string; archived_at: string | null }>(`/campaigns/${id}/archive`, {
        method: "POST",
        json: { archived },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

/** Every column of an own listing (owner view, any status). */
export type OwnCampaign = Omit<MyCampaign, "applications" | "recent_applicants"> & {
  brand_id: string;
  description: string | null;
  category: string | null;
  collaboration_model: "post" | "ugc";
  network: string;
  compensation_details: string | null;
  creators_needed: number;
  min_followers: number;
  city: string | null;
  requirements: string | null;
  usage_rights: string | null;
};

export function useOwnCampaign(id: string, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["campaigns", "own", id],
    queryFn: () => api<OwnCampaign>(`/campaigns/${id}?own=1`),
  });
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CampaignDraft) =>
      api<OwnCampaign>(`/campaigns/${id}`, { method: "PATCH", json: input }),
    onSuccess: (fresh) => {
      qc.setQueryData(["campaigns", "own", id], fresh);
      qc.invalidateQueries({ queryKey: campaignKeys.mine });
    },
  });
}

export function useChangeCampaignStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof CampaignStatusChange>) =>
      api<unknown>(`/campaigns/${id}/status`, { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export type CampaignCard = {
  id: string;
  title: string;
  category: string;
  network: string;
  deliverables: Deliverable[];
  compensation_type: string;
  compensation_value: number | null;
  compensation_details: string | null;
  currency: string;
  city: string | null;
  deadline: string;
  brand: { id: string; name: string; logo_url: string | null } | null;
};

/** Public listing page data (published only; the owner sees any status via useOwnCampaign). */
export type CampaignDetail = Omit<CampaignCard, "brand"> & {
  brand_id: string;
  status: CampaignStatusValue;
  description: string;
  requirements: string | null;
  min_followers: number;
  creators_needed: number;
  brand: { id: string; name: string; logo_url: string | null; category: string } | null;
  /** True for signed-out visitors: amount and extra were left out by the server. */
  pay_hidden?: boolean;
};

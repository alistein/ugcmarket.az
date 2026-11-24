"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
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
  Object.entries(f).forEach(([k, v]) => v !== undefined && String(v) !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * The browser's anonymous PostHog id, so the server can count signed-out board and listing
 * views (H3 funnel). Empty when PostHog isn't set up.
 */
function viewHeaders(): Record<string, string> {
  try {
    const id = posthog.__loaded ? posthog.get_distinct_id() : null;
    return id ? { "x-posthog-id": id } : {};
  } catch {
    return {};
  }
}

/** Cache key part for data that depends on who is looking (pay, "Applied", "Yours"). */
export function viewerKey(
  me:
    | { role: string | null; brand?: { id: string } | null; creator?: { id: string } | null }
    | null
    | undefined,
) {
  return me ? `${me.role ?? "none"}:${me.brand?.id ?? me.creator?.id ?? ""}` : "out";
}

export type BoardPage = { items: CampaignCard[]; total: number; page: number; page_size: number };

/** The public board, 20 at a time ("Show more"). Keyed by signed-in state: pay depends on it. */
export function useCampaignBoard(filters: Partial<CampaignFilters>, viewerKey: string) {
  return useInfiniteQuery({
    queryKey: [...campaignKeys.board(filters), viewerKey],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api<BoardPage>(`/campaigns${toQuery({ ...filters, page: pageParam })}`, { headers: viewHeaders() }),
    getNextPageParam: (last) => (last.page * last.page_size < last.total ? last.page + 1 : undefined),
  });
}

/** Pay is hidden from signed-out visitors and other brands, so the cache is split by viewer. */
export function useCampaign(id: string, viewerKey = "out") {
  return useQuery({
    queryKey: [...campaignKeys.detail(id), viewerKey],
    queryFn: () => api<CampaignDetail>(`/campaigns/${id}`, { headers: viewHeaders() }),
    // A 404 means "not published" (or gone): don't retry, the owner preview takes over.
    retry: (n, e) => !(e instanceof ApiClientError && e.status === 404) && n < 2,
  });
}

export type CampaignStatusValue = "draft" | "pending_review" | "published" | "paused" | "closed" | "rejected";

/** A brand's own listing, any status, with its application count. */
export type MyCampaign = {
  id: string;
  slug: string | null;
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
  /** Readable URL part, set when first published (null on drafts). */
  slug: string | null;
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
  min_followers: number;
  creators_needed: number;
  published_at: string | null;
  brand: { id: string; name: string; logo_url: string | null } | null;
  /** Why pay was left out by the server: signed out, or another brand's listing. null = shown. */
  pay_hidden: PayHidden;
  /** Creators: already applied. */
  applied?: boolean;
  /** Brands: their own listing. */
  mine?: boolean;
};

export type PayHidden = "signed_out" | "brand" | null;

/** Public listing page data (published only; the owner sees any status via useOwnCampaign). */
export type CampaignDetail = Omit<CampaignCard, "brand" | "applied" | "mine" | "pay_hidden"> & {
  pay_hidden?: PayHidden;
  brand_id: string;
  status: CampaignStatusValue;
  description: string;
  requirements: string | null;
  min_followers: number;
  creators_needed: number;
  brand: { id: string; name: string; logo_url: string | null; category: string } | null;
  /** Deadline passed: still opens from a link, but takes no applications. */
  ended?: boolean;
  /** Creators under the listing's minimum followers: a warning, they may still apply. */
  below_min_followers?: boolean;
};

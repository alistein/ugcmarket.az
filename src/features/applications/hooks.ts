"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignKeys } from "@/features/campaigns/hooks";
import type { Network, SocialStats } from "@/features/creators/hooks";
import { api } from "@/lib/api-client";

export const applicationKeys = {
  all: ["applications"] as const,
  mine: ["applications", "mine"] as const,
  campaign: (campaignId: string) => ["applications", "campaign", campaignId] as const,
};

export type ApplyResult = {
  application_id: string;
  already_applied: boolean;
  /** Brand Instagram only: phone and email are never sent to creators. */
  contact: { instagram: string | null } | null;
};

export function useApply(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { message?: string; bid_amount?: number }) =>
      api<ApplyResult>(`/campaigns/${campaignId}/apply`, { method: "POST", json: input }),
    // Besides the creator's own list, the board and the listing page carry the "Applied" mark.
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: applicationKeys.all }),
        qc.invalidateQueries({ queryKey: campaignKeys.boards }),
        qc.invalidateQueries({ queryKey: campaignKeys.details }),
      ]),
  });
}

/** The creator's own applications (newest first). */
export type MyApplication = {
  id: string;
  /** The creator's price on a bid listing. */
  bid_amount: number | null;
  created_at: string;
  campaign: { id: string; title: string | null; status: string; deadline: string | null } | null;
};

export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: applicationKeys.mine,
    queryFn: () => api<MyApplication[]>("/applications/mine"),
    enabled,
  });
}

/** One creator who applied to a brand's listing, with their private contacts (revealed to the brand). */
export type Applicant = {
  id: string;
  message: string | null;
  /** The creator's price on a bid listing (sealed: only this brand sees it). */
  bid_amount: number | null;
  created_at: string;
  creator: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
    gender: "female" | "male" | null;
    birth_year: number | null;
    skills: string[];
    shoot_options: string[];
    city: string;
    categories: string[];
    creator_socials: {
      network: Network;
      handle: string;
      followers: number | null;
      avg_views: number | null;
    }[];
    creator_social_stats: SocialStats[] | null;
  } | null;
  contact: { instagram: string | null; phone: string | null } | null;
};

export function useApplicants(campaignId: string) {
  return useQuery({
    queryKey: applicationKeys.campaign(campaignId),
    queryFn: () => api<Applicant[]>(`/campaigns/${campaignId}/applications`),
  });
}

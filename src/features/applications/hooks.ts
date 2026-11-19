"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Network, SocialStats } from "@/features/creators/hooks";
import { api } from "@/lib/api-client";

export type ApplyResult = {
  application_id: string;
  already_applied: boolean;
  contact: { instagram: string | null; phone: string | null; email: string | null } | null;
};

export function useApply(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) =>
      api<ApplyResult>(`/campaigns/${campaignId}/apply`, { method: "POST", json: { message } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

/** The creator's own applications (newest first). */
export type MyApplication = {
  id: string;
  created_at: string;
  campaign: { id: string; title: string | null; status: string; deadline: string | null } | null;
};

export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: ["applications", "mine"],
    queryFn: () => api<MyApplication[]>("/applications/mine"),
    enabled,
  });
}

/** One creator who applied to a brand's listing, with their private contacts (revealed to the brand). */
export type Applicant = {
  id: string;
  message: string | null;
  created_at: string;
  creator: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
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
    queryKey: ["applications", "campaign", campaignId],
    queryFn: () => api<Applicant[]>(`/campaigns/${campaignId}/applications`),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type ApplyResult = {
  application_id: string;
  already_applied: boolean;
  contact: { instagram: string | null; phone: string | null } | null;
};

export function useApply(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message?: string) =>
      api<ApplyResult>(`/campaigns/${campaignId}/apply`, { method: "POST", json: { message } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useMyApplications() {
  return useQuery({ queryKey: ["applications", "mine"], queryFn: () => api<unknown[]>("/applications/mine") });
}

export function useApplicants(campaignId: string) {
  return useQuery({
    queryKey: ["applications", "campaign", campaignId],
    queryFn: () => api<unknown[]>(`/campaigns/${campaignId}/applications`),
  });
}

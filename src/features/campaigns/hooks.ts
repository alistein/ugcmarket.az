"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { api } from "@/lib/api-client";
import type { CampaignFilters, CampaignInput, CampaignStatusChange, CampaignUpdate } from "@/schemas";

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
      api<{ items: CampaignCard[]; total: number; page: number; page_size: number }>(`/campaigns${toQuery(filters)}`),
  });
}

export function useCampaign(id: string) {
  return useQuery({ queryKey: campaignKeys.detail(id), queryFn: () => api<CampaignDetail>(`/campaigns/${id}`) });
}

export function useMyCampaigns() {
  return useQuery({ queryKey: campaignKeys.mine, queryFn: () => api<unknown[]>("/campaigns/mine") });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CampaignInput) => api<{ id: string }>("/campaigns", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.mine }),
  });
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof CampaignUpdate>) =>
      api<unknown>(`/campaigns/${id}`, { method: "PATCH", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
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
  format: string;
  compensation_type: string;
  compensation_value: number | null;
  currency: string;
  city: string | null;
  deadline: string;
  brand: { id: string; name: string; logo_url: string | null } | null;
};

export type CampaignDetail = CampaignCard & {
  description: string;
  requirements: string | null;
  posts_count: number;
  min_followers: number;
  usage_rights: string | null;
};

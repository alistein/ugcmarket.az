"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignKeys } from "@/features/campaigns/hooks";
import { creatorKeys } from "@/features/creators/hooks";
import { api } from "@/lib/api-client";

type Target = "creator" | "brand" | "campaign" | "user";
type Action = "approve" | "reject" | "block" | "unblock";
type QueueKind = "creators" | "brands" | "campaigns";

export const adminKeys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  queue: (kind: QueueKind) => ["admin", "queue", kind] as const,
};

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: () => api<Record<string, number>>("/admin/stats") });
}

export function useModerationQueue(kind: QueueKind) {
  return useQuery({ queryKey: adminKeys.queue(kind), queryFn: () => api<unknown[]>(`/admin/queue/${kind}`) });
}

export function useModerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      target,
      id,
      action,
      reason,
    }: {
      target: Target;
      id: string;
      action: Action;
      reason?: string;
    }) => api<void>(`/admin/${target}/${id}`, { method: "POST", json: { action, reason } }),
    // Moderation also changes what the public pages show (a listing or profile appears or goes).
    onSuccess: (_data, { target }) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: adminKeys.all }),
        ...(target === "campaign" ? [qc.invalidateQueries({ queryKey: campaignKeys.all })] : []),
        ...(target === "creator" ? [qc.invalidateQueries({ queryKey: creatorKeys.publics })] : []),
      ]),
  });
}

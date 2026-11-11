"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type Target = "creator" | "brand" | "campaign" | "user";
type Action = "approve" | "reject" | "block" | "unblock";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: () => api<Record<string, number>>("/admin/stats") });
}

export function useModerationQueue(kind: "creators" | "brands" | "campaigns") {
  return useQuery({ queryKey: ["admin", "queue", kind], queryFn: () => api<unknown[]>(`/admin/queue/${kind}`) });
}

export function useModerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ target, id, action, reason }: { target: Target; id: string; action: Action; reason?: string }) =>
      api<void>(`/admin/${target}/${id}`, { method: "POST", json: { action, reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

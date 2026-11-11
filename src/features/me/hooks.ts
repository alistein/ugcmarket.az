"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export type Me = {
  id: string;
  email: string | null;
  role: "brand" | "creator" | "admin" | null;
  status: string;
  creator: { id: string; handle: string; review_status: string } | null;
  brand: { id: string; name: string; review_status: string } | null;
} | null;

export const meKeys = { all: ["me"] as const };

export function useMe() {
  return useQuery({ queryKey: meKeys.all, queryFn: () => api<Me>("/me") });
}

export function useSetRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: "brand" | "creator") => api<void>("/me/role", { method: "POST", json: { role } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.all }),
  });
}

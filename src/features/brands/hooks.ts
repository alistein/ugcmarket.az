"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "@/features/me/hooks";
import { api } from "@/lib/api-client";
import type { BrandProfileInput } from "@/schemas";

export type MyBrand = {
  id: string;
  name: string;
  logo_url: string | null;
  category: string;
  website: string | null;
  review_status: "pending" | "approved" | "rejected";
  created_at: string;
  brand_contacts: { instagram: string | null; phone: string | null; email: string | null } | null;
};

export const brandKeys = { mine: ["brands", "mine"] as const };

/** Own brand, or null before setup. */
export function useMyBrand(enabled = true) {
  return useQuery({ queryKey: brandKeys.mine, queryFn: () => api<MyBrand | null>("/brands/me"), enabled });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandProfileInput) => api<MyBrand>("/brands", { method: "POST", json: input }),
    onSuccess: (brand) => {
      qc.setQueryData(brandKeys.mine, brand);
      qc.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandProfileInput) => api<MyBrand>("/brands/me", { method: "PATCH", json: input }),
    onSuccess: (brand) => {
      qc.setQueryData(brandKeys.mine, brand);
      qc.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

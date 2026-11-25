"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { applicationKeys } from "@/features/applications/hooks";
import { api } from "@/lib/api-client";
import type { PostSubmissionInput } from "@/schemas";

export function useSubmitPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof PostSubmissionInput>) =>
      api<unknown>("/posts", { method: "POST", json: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
}

export function useConfirmPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api<unknown>(`/posts/${postId}/confirm`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
}

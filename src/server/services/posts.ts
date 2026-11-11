import "server-only";
import type { z } from "zod";
import type { PostSubmissionInput } from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

/** Creator submits the published post link + stats (self-reported). */
export async function submitPost(user: SessionUser, input: z.infer<typeof PostSubmissionInput>) {
  const supabase = await createUserClient();
  // RLS insert policy ensures the application belongs to this creator.
  const { data, error } = await supabase
    .from("post_submissions")
    .insert({ ...input, self_reported: true })
    .select()
    .single();
  if (error?.code === "42501") throw errors.forbidden();
  if (error) throw error;
  await track(user.id, "post_submitted", { application_id: input.application_id, views: input.views });
  return data;
}

/** Brand confirms the post went live. Basis for the "verified collaboration" badge. */
export async function confirmPost(user: SessionUser, id: string) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("post_submissions")
    .update({ confirmed_by_brand_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("post"); // RLS: not this brand's post
  await track(user.id, "post_confirmed", { post_id: id });
  return data;
}

import "server-only";
import type { z } from "zod";
import {
  CampaignInput,
  type CampaignDraft,
  type CampaignFilters,
  type CampaignStatusChange,
} from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createAdminClient, createPublicClient, createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";
import { getMyBrand } from "./brands";

const BOARD_FIELDS =
  "id, title, category, network, deliverables, compensation_type, compensation_value, compensation_details, currency, city, min_followers, deadline, published_at, brand:brands(id, name, logo_url)";

/**
 * Pay is for signed-in users only (founders, 2026-11-19): signed-out visitors get the listing
 * without the amount and the extra, and `pay_hidden: true` so the UI can show a log-in prompt.
 * Stripped on the server so the numbers never reach an anonymous browser.
 */
function payFor<T extends { compensation_value: number | null; compensation_details: string | null }>(
  row: T,
  viewer: SessionUser | null,
) {
  return viewer
    ? { ...row, pay_hidden: false }
    : { ...row, compensation_value: null, compensation_details: null, pay_hidden: true };
}

/** Public board: published campaigns only. */
export async function listBoard(f: CampaignFilters, viewer: SessionUser | null = null) {
  let q = createPublicClient()
    .from("campaigns")
    .select(BOARD_FIELDS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range((f.page - 1) * f.page_size, f.page * f.page_size - 1);
  if (f.network) q = q.eq("network", f.network);
  if (f.compensation_type) q = q.eq("compensation_type", f.compensation_type);
  if (f.city) q = q.eq("city", f.city);
  if (f.category) q = q.eq("category", f.category);
  const { data, count, error } = await q;
  if (error) throw error;
  return { items: data.map((c) => payFor(c, viewer)), total: count ?? 0, page: f.page, page_size: f.page_size };
}

/** Public detail (published only). Also used by generateMetadata. */
export async function getPublicCampaign(id: string, viewer: SessionUser | null = null) {
  const { data, error } = await createPublicClient()
    .from("campaigns")
    .select("*, brand:brands(id, name, logo_url, category)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? payFor(data, viewer) : null;
}

/** Owner view (any status). RLS limits to the brand's own campaigns. */
export async function getOwnCampaign(user: SessionUser, id: string) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("brand_id", brand.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("campaign");
  return data;
}

export async function listMyCampaigns(user: SessionUser) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase
    .from("campaigns")
    // Count of applications, plus the newest three applicants for the avatar stack.
    .select(
      "*, applications(count), recent_applicants:applications(created_at, creator:creators(display_name, avatar_url))",
    )
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "recent_applicants", ascending: false })
    .limit(3, { referencedTable: "recent_applicants" });
  if (error) throw error;
  return data;
}

/** New listings are always drafts, so they may be half-filled. Publishing is a status change. */
export async function createCampaign(user: SessionUser, input: CampaignDraft) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...input, brand_id: brand.id }) // status defaults to 'draft' (brands can't set it)
    .select()
    .single();
  if (error) throw error;
  await track(user.id, "campaign_created", { campaign_id: data.id });
  return data;
}

/** Drafts save as they are; any other status must stay a complete listing. */
export async function updateCampaign(user: SessionUser, id: string, input: CampaignDraft) {
  const supabase = await createUserClient();
  const current = await getOwnCampaign(user, id);
  // Closed listings are history (applications point at them); duplicate to reuse one.
  if (current.status === "closed") throw errors.conflict("campaign_closed");
  if (current.status !== "draft") CampaignInput.parse(input); // ZodError → 422 with field errors
  const { data, error } = await supabase.from("campaigns").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/**
 * Brand status changes. "published" goes to admin review first unless the brand is approved.
 * Brands can't write status/published_at directly (column grants), so after the ownership check
 * the change is written with the service role.
 * TODO(founders): decide pre- vs post-moderation (wiki: open-questions).
 */
export async function changeCampaignStatus(
  user: SessionUser,
  id: string,
  { status }: z.infer<typeof CampaignStatusChange>,
) {
  const campaign = await getOwnCampaign(user, id);
  const brand = await getMyBrand(user);

  if (status === "published") assertPublishable(campaign);

  let next: string = status;
  if (status === "published") {
    next = brand.review_status === "approved" ? "published" : "pending_review";
  }
  const { data, error } = await createAdminClient()
    .from("campaigns")
    .update({
      status: next as "draft" | "pending_review" | "published" | "paused" | "closed",
      published_at:
        next === "published" ? (campaign.published_at ?? new Date().toISOString()) : campaign.published_at,
    })
    .eq("id", id)
    .eq("brand_id", brand.id)
    .select()
    .single();
  if (error) throw error;
  if (next === "published") await track(user.id, "campaign_published", { campaign_id: id });
  return data;
}

/** A listing goes live only when complete and its deadline is ahead (drafts may be partial). */
function assertPublishable(campaign: Record<string, unknown>) {
  const check = CampaignInput.safeParse(campaign);
  if (check.success) return;
  const onlyDeadline = check.error.issues.every(
    (i) => i.path[0] === "deadline" && i.message === "validation.deadlinePast",
  );
  throw errors.conflict(onlyDeadline ? "campaign_deadline_passed" : "campaign_incomplete");
}

export async function duplicateCampaign(user: SessionUser, id: string) {
  const c = await getOwnCampaign(user, id);
  const { id: _id, created_at, updated_at, published_at, status, ...rest } = c;
  void _id;
  void created_at;
  void updated_at;
  void published_at;
  void status;
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("campaigns")
    // Same title (an English "(copy)" suffix reads wrong in az/ru); the copy is a fresh draft.
    .insert(rest)
    .select()
    .single();
  if (error) throw error;
  return data;
}

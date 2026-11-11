import "server-only";
import type { z } from "zod";
import type { CampaignFilters, CampaignInput, CampaignStatusChange, CampaignUpdate } from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createPublicClient, createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";
import { getMyBrand } from "./brands";

const BOARD_FIELDS =
  "id, title, category, network, format, posts_count, compensation_type, compensation_value, currency, city, min_followers, deadline, published_at, brand:brands(id, name, logo_url)";

/** Public board: published campaigns only. */
export async function listBoard(f: CampaignFilters) {
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
  return { items: data, total: count ?? 0, page: f.page, page_size: f.page_size };
}

/** Public detail (published only). Also used by generateMetadata. */
export async function getPublicCampaign(id: string) {
  const { data, error } = await createPublicClient()
    .from("campaigns")
    .select("*, brand:brands(id, name, logo_url, category)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Owner view (any status). RLS limits to the brand's own campaigns. */
export async function getOwnCampaign(user: SessionUser, id: string) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).eq("brand_id", brand.id).maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("campaign");
  return data;
}

export async function listMyCampaigns(user: SessionUser) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, applications(count)")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCampaign(user: SessionUser, input: CampaignInput) {
  const supabase = await createUserClient();
  const brand = await getMyBrand(user);
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...input, brand_id: brand.id, status: "draft" })
    .select()
    .single();
  if (error) throw error;
  await track(user.id, "campaign_created", { campaign_id: data.id });
  return data;
}

export async function updateCampaign(user: SessionUser, id: string, input: z.infer<typeof CampaignUpdate>) {
  const supabase = await createUserClient();
  await getOwnCampaign(user, id);
  const { data, error } = await supabase.from("campaigns").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

/**
 * Brand status changes. "published" goes to admin review first unless the brand is approved.
 * TODO(founders): decide pre- vs post-moderation (wiki: open-questions).
 */
export async function changeCampaignStatus(
  user: SessionUser,
  id: string,
  { status }: z.infer<typeof CampaignStatusChange>,
) {
  const supabase = await createUserClient();
  const campaign = await getOwnCampaign(user, id);
  const brand = await getMyBrand(user);

  let next: string = status;
  if (status === "published") {
    next = brand.review_status === "approved" ? "published" : "pending_review";
  }
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      status: next as "draft" | "pending_review" | "published" | "paused" | "closed",
      published_at: next === "published" ? (campaign.published_at ?? new Date().toISOString()) : campaign.published_at,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  if (next === "published") await track(user.id, "campaign_published", { campaign_id: id });
  return data;
}

export async function duplicateCampaign(user: SessionUser, id: string) {
  const c = await getOwnCampaign(user, id);
  const { id: _id, created_at, updated_at, published_at, status, ...rest } = c;
  void _id; void created_at; void updated_at; void published_at; void status;
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...rest, title: `${c.title} (copy)`, status: "draft" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

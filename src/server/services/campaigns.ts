import "server-only";
import type { z } from "zod";
import {
  CampaignInput,
  type CampaignDraft,
  type CampaignArchiveChange,
  type CampaignFilters,
  type CampaignStatusChange,
  type SocialNetwork,
} from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createAdminClient, createPublicClient, createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";
import { getMyBrand } from "./brands";

const BOARD_FIELDS =
  "id, slug, brand_id, title, category, network, deliverables, compensation_type, compensation_value, compensation_details, currency, city, min_followers, creators_needed, deadline, published_at, brand:brands(id, name, logo_url)";

/** Today in Baku (YYYY-MM-DD): deadlines are calendar days there, not UTC. */
export function bakuToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

/** Who is looking, as far as the board cares. Built once per request. */
export type BoardViewer = {
  user: SessionUser | null;
  /** Set for brand accounts: their own listings show pay, others' don't. */
  brandId: string | null;
  /** Set for creator accounts (for the "Applied" mark and the follower check). */
  creatorId: string | null;
};

export async function boardViewer(user: SessionUser | null): Promise<BoardViewer> {
  if (!user || (user.role !== "brand" && user.role !== "creator"))
    return { user, brandId: null, creatorId: null };
  const supabase = await createUserClient();
  const table = user.role === "brand" ? "brands" : "creators";
  const { data } = await supabase.from(table).select("id").eq("profile_id", user.id).maybeSingle();
  return {
    user,
    brandId: user.role === "brand" ? (data?.id ?? null) : null,
    creatorId: user.role === "creator" ? (data?.id ?? null) : null,
  };
}

export type PayHidden = "signed_out" | "brand" | null;

/**
 * Who sees pay, decided on the server so the numbers never reach a browser that shouldn't
 * have them:
 * - signed-out visitors: no (founders, 2026-11-19), the UI shows a log-in prompt;
 * - brands: only on their own listings, never a competitor's (founders, 2026-11-24, D4);
 * - creators and admins: yes.
 */
function payFor<
  T extends {
    compensation_value: number | null;
    compensation_details: string | null;
    brand_id: string;
  },
>(row: T, v: BoardViewer) {
  const hidden: PayHidden = !v.user
    ? "signed_out"
    : // brand_id, not the brand join: the join is empty when the brand isn't approved yet.
      v.user.role === "brand" && row.brand_id !== v.brandId
      ? "brand"
      : null;
  return hidden
    ? { ...row, compensation_value: null, compensation_details: null, pay_hidden: hidden }
    : { ...row, pay_hidden: null };
}

/**
 * Public board: published listings whose deadline is today or later (past ones drop off, D12),
 * newest first. A city filter also keeps "any city" listings. Creators get `applied` per item,
 * brands get `mine`. Page 1 counts as a board view (H3 funnel).
 */
export async function listBoard(f: CampaignFilters, v: BoardViewer, distinctId: string | null = null) {
  let q = createPublicClient()
    .from("campaigns")
    .select(BOARD_FIELDS, { count: "exact" })
    .eq("status", "published")
    .gte("deadline", bakuToday())
    .order("published_at", { ascending: false })
    .range((f.page - 1) * f.page_size, f.page * f.page_size - 1);
  if (f.network) q = q.eq("network", f.network);
  if (f.compensation_type) q = q.eq("compensation_type", f.compensation_type);
  // Both are closed lists (schema), so they're safe inside the filter string.
  if (f.city) q = q.or(`city.eq.${f.city},city.is.null`);
  if (f.category) q = q.eq("category", f.category);
  const { data, count, error } = await q;
  if (error) throw error;

  const applied = new Set<string>();
  if (v.creatorId && data.length) {
    const { data: apps } = await (
      await createUserClient()
    )
      .from("applications")
      .select("campaign_id")
      .eq("creator_id", v.creatorId)
      .in(
        "campaign_id",
        data.map((c) => c.id),
      );
    apps?.forEach((a) => applied.add(a.campaign_id));
  }

  const total = count ?? 0;
  const id = v.user?.id ?? distinctId;
  if (f.page === 1 && id)
    await track(id, "board_viewed", {
      signed_in: !!v.user,
      role: v.user?.role ?? null,
      compensation_type: f.compensation_type ?? null,
      city: f.city ?? null,
      category: f.category ?? null,
      results: total,
    });

  return {
    items: data.map((c) => ({
      ...payFor(c, v),
      applied: applied.has(c.id),
      mine: !!v.brandId && c.brand_id === v.brandId,
    })),
    total,
    page: f.page,
    page_size: f.page_size,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public detail (published only), by slug or by id (links shared before slugs existed).
 * Also used by generateMetadata (no viewer: pay hidden).
 */
export async function getPublicCampaign(
  idOrSlug: string,
  v: BoardViewer = { user: null, brandId: null, creatorId: null },
) {
  const { data, error } = await createPublicClient()
    .from("campaigns")
    .select("*, brand:brands(id, name, logo_url, category)")
    .eq(UUID.test(idOrSlug) ? "id" : "slug", idOrSlug.toLowerCase())
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...payFor(data, v), ended: !!data.deadline && data.deadline < bakuToday() };
}

/**
 * The listing page as a viewer opens it: the public detail, plus for creators whether they're
 * under the listing's minimum followers (a warning, not a block: D10), and a view event.
 */
export async function viewPublicCampaign(idOrSlug: string, v: BoardViewer, distinctId: string | null = null) {
  const campaign = await getPublicCampaign(idOrSlug, v);
  if (!campaign) return null;

  let below_min_followers = false;
  if (v.creatorId && campaign.min_followers > 0) {
    const followers = await creatorFollowers(v.creatorId, campaign.network);
    below_min_followers = followers !== null && followers < campaign.min_followers;
  }

  const who = v.user?.id ?? distinctId;
  if (who)
    await track(who, "campaign_viewed", {
      campaign_id: campaign.id,
      signed_in: !!v.user,
      role: v.user?.role ?? null,
    });

  return { ...campaign, below_min_followers };
}

/**
 * A creator's followers on one network: the checked number when it exists for the same handle,
 * otherwise what they entered (same rule as `socialNumbers` in the UI). Largest account wins
 * when they listed several. null = no account on that network.
 */
async function creatorFollowers(creatorId: string, network: SocialNetwork) {
  const supabase = await createUserClient();
  const [{ data: socials }, { data: stats }] = await Promise.all([
    supabase
      .from("creator_socials")
      .select("handle, followers")
      .eq("creator_id", creatorId)
      .eq("network", network),
    supabase
      .from("creator_social_stats")
      .select("handle, followers, fetched_at")
      .eq("creator_id", creatorId)
      .eq("network", network),
  ]);
  if (!socials?.length) return null;
  return Math.max(
    ...socials.map((s) => {
      const st = stats?.find(
        (x) => x.handle.toLowerCase() === s.handle.toLowerCase() && x.fetched_at && x.followers != null,
      );
      return st?.followers ?? s.followers;
    }),
  );
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
  if (current.archived_at) throw errors.conflict("campaign_archived");
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

  if (campaign.archived_at) throw errors.conflict("campaign_archived");
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

/** Statuses a listing can be archived from: nothing live or waiting on review. */
const ARCHIVABLE = new Set(["draft", "rejected", "closed"]);

/**
 * Archive hides a finished listing from the brand's main list (it keeps its status and its
 * applications); restore brings it back as it was. Live listings are closed first, so nothing
 * on the board disappears silently. Written with the service role (no column grant), like status.
 */
export async function setCampaignArchived(
  user: SessionUser,
  id: string,
  { archived }: z.infer<typeof CampaignArchiveChange>,
) {
  const campaign = await getOwnCampaign(user, id);
  if (archived && !ARCHIVABLE.has(campaign.status)) throw errors.conflict("campaign_not_archivable");
  const { data, error } = await createAdminClient()
    .from("campaigns")
    .update({ archived_at: archived ? (campaign.archived_at ?? new Date().toISOString()) : null })
    .eq("id", id)
    .eq("brand_id", campaign.brand_id)
    .select()
    .single();
  if (error) throw error;
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
  // The copy is a new draft: no slug until it's published (the trigger sets it).
  const { id: _id, created_at, updated_at, published_at, status, archived_at, slug, ...rest } = c;
  void _id;
  void slug;
  void archived_at;
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

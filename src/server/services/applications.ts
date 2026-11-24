import "server-only";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createAdminClient, createUserClient } from "@/server/db/supabase";
import type { ApplicationInput } from "@/schemas";
import { errors } from "@/server/http/errors";
import { bakuToday, getOwnCampaign } from "./campaigns";
import { getMyCreator } from "./creators";

/**
 * Creator applies → application is logged → brand contact is revealed.
 * The deal itself happens off-platform (Instagram/phone). See wiki: off-platform-deal-model.
 * On a "bid" listing the creator also names their price (sealed: only the brand sees it).
 */
export async function apply(
  user: SessionUser,
  campaignId: string,
  { message, bid_amount }: ApplicationInput,
) {
  const supabase = await createUserClient();
  const creator = await getMyCreator(user);
  if (creator.review_status !== "approved") throw errors.forbidden();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, brand_id, status, min_followers, compensation_type, deadline")
    .eq("id", campaignId)
    .eq("status", "published")
    .maybeSingle();
  if (!campaign) throw errors.notFound("campaign");
  // Past its deadline: off the board, and no new applications (showing contacts again is fine).
  const ended = !!campaign.deadline && campaign.deadline < bakuToday();

  const isBid = campaign.compensation_type === "bid";

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("creator_id", creator.id)
    .maybeSingle();

  let applicationId = existing?.id;
  if (!applicationId) {
    if (ended) throw errors.conflict("campaign_ended");
    // A bid is set once, with the application; showing the contacts again needs no bid.
    if (isBid && !bid_amount)
      throw errors.validation({ formErrors: [], fieldErrors: { bid_amount: ["validation.bidRequired"] } });
    const { data, error } = await supabase
      .from("applications")
      .insert({
        campaign_id: campaignId,
        creator_id: creator.id,
        message,
        bid_amount: isBid ? bid_amount : null,
        contact_revealed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    applicationId = data.id;
    await track(user.id, "application_created", {
      campaign_id: campaignId,
      ...(isBid && { bid_amount }),
    });
  }

  // Contacts are private (RLS); read with service role only after the application exists.
  // Creators get the brand's Instagram only. Phone and email are personal (often an employee's
  // own) and never leave the server (founders, 2026-11-24).
  const { data: contact } = await createAdminClient()
    .from("brand_contacts")
    .select("instagram")
    .eq("brand_id", campaign.brand_id)
    .maybeSingle();
  await track(user.id, "contact_revealed", { campaign_id: campaignId });

  return { application_id: applicationId, already_applied: Boolean(existing), contact };
}

/** Brand sees applicants of its own campaign, with creator contacts. */
export async function listApplicants(user: SessionUser, campaignId: string) {
  await getOwnCampaign(user, campaignId);
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, message, bid_amount, created_at, creator:creators(id, handle, display_name, avatar_url, gender, birth_year, city, categories, lifestyle_tags, skills, shoot_options, creator_socials(network, handle, followers, avg_views), creator_social_stats(network, handle, followers, avg_views, avg_likes, fetched_at)), post_submissions(*)",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const creatorIds = data.map((a) => a.creator?.id).filter((x): x is string => Boolean(x));
  const { data: contacts } = await createAdminClient()
    .from("creator_contacts")
    .select("creator_id, instagram, phone")
    .in("creator_id", creatorIds.length ? creatorIds : ["00000000-0000-0000-0000-000000000000"]);
  const byId = new Map((contacts ?? []).map((c) => [c.creator_id, c]));

  return data.map((a) => ({ ...a, contact: a.creator ? (byId.get(a.creator.id) ?? null) : null }));
}

export async function listMyApplications(user: SessionUser) {
  const supabase = await createUserClient();
  const creator = await getMyCreator(user);
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, bid_amount, created_at, campaign:campaigns(id, title, status, deadline, compensation_type, currency, brand:brands(name, logo_url)), post_submissions(*)",
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

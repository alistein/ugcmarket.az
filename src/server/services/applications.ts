import "server-only";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createAdminClient, createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";
import { getOwnCampaign } from "./campaigns";
import { getMyCreator } from "./creators";

/**
 * Creator applies → application is logged → brand contact is revealed.
 * The deal itself happens off-platform (Instagram/phone). See wiki: off-platform-deal-model.
 */
export async function apply(user: SessionUser, campaignId: string, message?: string) {
  const supabase = await createUserClient();
  const creator = await getMyCreator(user);
  if (creator.review_status !== "approved") throw errors.forbidden();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, brand_id, status, min_followers")
    .eq("id", campaignId)
    .eq("status", "published")
    .maybeSingle();
  if (!campaign) throw errors.notFound("campaign");

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("creator_id", creator.id)
    .maybeSingle();

  let applicationId = existing?.id;
  if (!applicationId) {
    const { data, error } = await supabase
      .from("applications")
      .insert({ campaign_id: campaignId, creator_id: creator.id, message, contact_revealed_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw error;
    applicationId = data.id;
    await track(user.id, "application_created", { campaign_id: campaignId });
  }

  // Contacts are private (RLS); read with service role only after the application exists.
  const { data: contact } = await createAdminClient()
    .from("brand_contacts")
    .select("instagram, phone")
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
      "id, message, created_at, creator:creators(id, handle, display_name, avatar_url, city, categories, creator_socials(network, handle, followers, avg_views)), post_submissions(*)",
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
    .select("id, created_at, campaign:campaigns(id, title, status, deadline, brand:brands(name, logo_url)), post_submissions(*)")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

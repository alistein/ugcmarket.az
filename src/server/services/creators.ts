import "server-only";
import { after } from "next/server";
import { env } from "@/lib/env";
import type {
  CreatorProfileInput,
  CreatorProfileUpdate,
  CreatorPriceInput,
  CreatorSocialInput,
} from "@/schemas";
import type { PortfolioItem } from "@/schemas/creator";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createAdminClient, createPublicClient, createUserClient } from "@/server/db/supabase";
import { ApiError, errors } from "@/server/http/errors";
import {
  checkPost,
  ownsPost,
  refreshCreatorSocialStatsQuietly,
  refreshPortfolioItemStatsQuietly,
  savePostStats,
} from "./social-stats";

type Db = Awaited<ReturnType<typeof createUserClient>>;

const PUBLIC_FIELDS =
  "id, handle, display_name, avatar_url, gender, birth_year, city, country, categories, languages, bio, paid_open, barter_open, repost_open, shoot_options, skills, review_status, created_at, creator_socials(network, handle, followers, avg_views, verified), creator_social_stats(network, handle, followers, posts, avg_views, avg_likes, source, fetched_at), creator_prices(format, amount, currency), portfolio_items(id, url, network, title, position, portfolio_item_stats(owner_handle, views, likes, comments, posted_at, fetched_at, thumbnail_url, caption, hashtags, mentions, duration_seconds, music, paid_partnership))";

/**
 * Public profile. Uses the cookie-less client so it can also run in generateMetadata.
 * RLS only returns approved creators; contacts are never included.
 */
export async function getPublicCreator(handle: string) {
  const { data, error } = await createPublicClient()
    .from("creators")
    .select(PUBLIC_FIELDS)
    .eq("handle", handle.toLowerCase())
    .eq("review_status", "approved")
    .order("position", { referencedTable: "portfolio_items" })
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Own profile incl. private contacts and review status. null when not created yet. */
export async function findMyCreator(user: SessionUser) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("creators")
    .select(`${PUBLIC_FIELDS}, creator_contacts(instagram, phone)`)
    .eq("profile_id", user.id)
    .order("position", { referencedTable: "portfolio_items" })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { creator_contacts, ...rest } = data;
  const contacts = Array.isArray(creator_contacts) ? creator_contacts[0] : creator_contacts;
  return { ...rest, contact_instagram: contacts?.instagram ?? null, contact_phone: contacts?.phone ?? null };
}

export async function getMyCreator(user: SessionUser) {
  const me = await findMyCreator(user);
  if (!me) throw errors.notFound("creator");
  return me;
}

/** Only files the user uploaded to our avatars bucket (their own folder) are accepted. */
function assertOwnAvatar(user: SessionUser, url: string | null | undefined) {
  if (!url) return;
  const prefix = `${env.supabaseUrl}/storage/v1/object/public/avatars/${user.id}/`;
  if (!url.startsWith(prefix))
    throw errors.validation({ fieldErrors: { avatar_url: ["validation.avatar"] } });
}

async function replaceSocials(db: Db, creatorId: string, socials: CreatorSocialInput[]) {
  const del = await db.from("creator_socials").delete().eq("creator_id", creatorId);
  if (del.error) throw del.error;
  if (!socials.length) return;
  const { error } = await db
    .from("creator_socials")
    .insert(socials.map((s) => ({ ...s, creator_id: creatorId })));
  if (error) throw error;
}

async function replacePrices(db: Db, creatorId: string, prices: CreatorPriceInput[]) {
  const del = await db.from("creator_prices").delete().eq("creator_id", creatorId);
  if (del.error) throw del.error;
  if (!prices.length) return;
  const { error } = await db
    .from("creator_prices")
    .insert(prices.map((p) => ({ ...p, creator_id: creatorId })));
  if (error) throw error;
}

async function saveContacts(
  db: Db,
  creatorId: string,
  instagram: string | null | undefined,
  phone: string | null | undefined,
) {
  if (instagram === undefined && phone === undefined) return;
  const row: { creator_id: string; instagram?: string | null; phone?: string | null } = {
    creator_id: creatorId,
  };
  if (instagram !== undefined) row.instagram = instagram;
  if (phone !== undefined) row.phone = phone;
  const { error } = await db.from("creator_contacts").upsert(row);
  if (error) throw error;
}

const handleTaken = (e: { code?: string } | null) => e?.code === "23505";

export async function isHandleAvailable(handle: string) {
  const supabase = await createUserClient();
  const { data, error } = await supabase.rpc("handle_available", { h: handle.toLowerCase() });
  // PGRST202 = function not found → migration 20261112100000_creator_profile.sql not applied.
  if (error?.code === "PGRST202") {
    throw new Error(
      "handle_available() is missing in the database. Run `pnpm db:push && pnpm db:types:remote`.",
    );
  }
  if (error) throw error;
  return !!data;
}

export async function createMyCreator(user: SessionUser, input: CreatorProfileInput) {
  if (await findMyCreator(user)) throw errors.conflict("creator_exists");
  assertOwnAvatar(user, input.avatar_url);
  const supabase = await createUserClient();
  const { contact_instagram, contact_phone, socials, prices, ...profile } = input;
  const { data, error } = await supabase
    .from("creators")
    .insert({ ...profile, profile_id: user.id })
    .select("id, handle")
    .single();
  if (handleTaken(error)) throw errors.conflict("handle_taken");
  if (error) throw error;

  // Not transactional (PostgREST); a failure here leaves a valid profile the user can finish editing.
  await saveContacts(supabase, data.id, contact_instagram ?? null, contact_phone ?? null);
  if (socials?.length) await replaceSocials(supabase, data.id, socials);
  if (prices?.length) await replacePrices(supabase, data.id, prices);
  // Sign-up doesn't ask to connect the account: look the numbers up now, so the new profile
  // shows them right away. Never throws; a failed lookup can be retried from the profile.
  if (socials?.length) await refreshCreatorSocialStatsQuietly(data.id);
  await track(user.id, "creator_profile_completed");
  return getMyCreator(user);
}

export async function updateMyCreator(user: SessionUser, input: CreatorProfileUpdate) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  assertOwnAvatar(user, input.avatar_url);
  const { socials, prices, contact_instagram, contact_phone, ...profile } = input;

  if (Object.keys(profile).length) {
    const { error } = await supabase.from("creators").update(profile).eq("id", me.id);
    if (handleTaken(error)) throw errors.conflict("handle_taken");
    if (error) throw error;
  }
  await saveContacts(supabase, me.id, contact_instagram, contact_phone);
  if (socials) {
    await replaceSocials(supabase, me.id, socials);
    after(() => refreshCreatorSocialStatsQuietly(me.id));
  }
  if (prices) await replacePrices(supabase, me.id, prices);
  return getMyCreator(user);
}

export async function addPortfolioItem(user: SessionUser, input: PortfolioItem) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  if (me.portfolio_items.some((p) => p.url === input.url)) throw errors.conflict("portfolio_duplicate");

  // Only the creator's own posts. When the link names the account we know without a lookup;
  // otherwise one (cached) lookup tells us, and a foreign post is refused and never stored.
  const own = me.creator_socials.find((s) => s.network === input.network)?.handle.toLowerCase();
  const notYours = () => new ApiError(422, "portfolio_not_yours", "errors.portfolio_not_yours");
  if (own && input.account && input.account !== own) throw notYours();

  // Gate before saving: things only the post itself can tell us (it's gone, the account is
  // private, it's a photo). Provider outages aren't the creator's fault: save and check later.
  const check = await checkPost(input.network, input.url);
  if (check.status === "not_found")
    throw new ApiError(422, "portfolio_not_found", "errors.portfolio_not_found");
  if (check.status === "private") throw new ApiError(422, "portfolio_private", "errors.portfolio_private");
  if (check.status === "not_video")
    throw new ApiError(422, "portfolio_not_video", "errors.portfolio_not_video");
  if (check.status === "ok" && own && !ownsPost(check.value, own)) throw notYours();

  const position = Math.max(-1, ...me.portfolio_items.map((p) => p.position)) + 1;
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      url: input.url,
      network: input.network,
      title: input.title || null,
      creator_id: me.id,
      position,
    })
    .select("id, url, network, title, position")
    .single();
  if (error) throw error;
  if (check.status === "ok") await savePostStats(data.id, check);
  else after(() => refreshPortfolioItemStatsQuietly(data.id));
  return data;
}

export async function removePortfolioItem(user: SessionUser, id: string) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  // The cover stays: it's stored per post and other creators may link the same one.
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id).eq("creator_id", me.id);
  if (error) throw error;
}

/**
 * A creator's contacts for a brand that wants to work with them (founders, 2026-11-25: brands
 * see phone, email and Instagram from the profile). Approved creators only; the caller must be
 * a brand with a brand profile. Contacts are read with the service role (never public) and every
 * reveal is tracked.
 */
export async function getCreatorContactsForBrand(user: SessionUser, handle: string) {
  const supabase = await createUserClient();
  const { data: brand } = await supabase.from("brands").select("id").eq("profile_id", user.id).maybeSingle();
  if (!brand) throw new ApiError(403, "brand_profile_required", "errors.brand_profile_required");

  const db = createAdminClient();
  const { data: creator, error } = await db
    .from("creators")
    .select("id, profile_id, creator_socials(network, handle), creator_contacts(instagram, phone)")
    .eq("handle", handle.toLowerCase())
    .eq("review_status", "approved")
    .maybeSingle();
  if (error) throw error;
  if (!creator) throw errors.notFound("creator");

  const contacts = Array.isArray(creator.creator_contacts)
    ? creator.creator_contacts[0]
    : creator.creator_contacts;
  const instagram =
    contacts?.instagram ?? creator.creator_socials.find((s) => s.network === "instagram")?.handle ?? null;
  const { data: auth } = await db.auth.admin.getUserById(creator.profile_id);

  await track(user.id, "contact_revealed", { creator_id: creator.id, from: "profile" });
  return { instagram, phone: contacts?.phone ?? null, email: auth?.user?.email ?? null };
}

import "server-only";
import type { z } from "zod";
import type { CreatorProfileInput, CreatorProfileUpdate, PortfolioItemInput } from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createPublicClient, createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

const PUBLIC_FIELDS =
  "id, handle, display_name, avatar_url, city, country, categories, languages, bio, barter_open, review_status, created_at, creator_socials(network, handle, followers, avg_views, verified), creator_prices(format, amount, currency), portfolio_items(id, url, network, title, position)";

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
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyCreator(user: SessionUser) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("creators")
    .select(`${PUBLIC_FIELDS}, creator_contacts(instagram, phone)`)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("creator");
  return data;
}

export async function createMyCreator(user: SessionUser, input: CreatorProfileInput) {
  const supabase = await createUserClient();
  const { contact_instagram, contact_phone, ...profile } = input;
  const { data, error } = await supabase
    .from("creators")
    .insert({ ...profile, handle: profile.handle.toLowerCase(), profile_id: user.id })
    .select("id, handle")
    .single();
  if (error?.code === "23505") throw errors.conflict("handle_taken");
  if (error) throw error;
  await supabase.from("creator_contacts").insert({ creator_id: data.id, instagram: contact_instagram, phone: contact_phone });
  await track(user.id, "creator_profile_completed");
  return data;
}

export async function updateMyCreator(user: SessionUser, input: z.infer<typeof CreatorProfileUpdate>) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  const { socials, prices, contact_instagram, contact_phone, ...profile } = input;

  if (Object.keys(profile).length) {
    const { error } = await supabase.from("creators").update(profile).eq("id", me.id);
    if (error?.code === "23505") throw errors.conflict("handle_taken");
    if (error) throw error;
  }
  if (contact_instagram !== undefined || contact_phone !== undefined) {
    await supabase
      .from("creator_contacts")
      .upsert({ creator_id: me.id, instagram: contact_instagram, phone: contact_phone });
  }
  if (socials) {
    await supabase.from("creator_socials").delete().eq("creator_id", me.id);
    if (socials.length) await supabase.from("creator_socials").insert(socials.map((s) => ({ ...s, creator_id: me.id })));
  }
  if (prices) {
    await supabase.from("creator_prices").delete().eq("creator_id", me.id);
    if (prices.length) await supabase.from("creator_prices").insert(prices.map((p) => ({ ...p, creator_id: me.id })));
  }
  return getMyCreator(user);
}

export async function addPortfolioItem(user: SessionUser, input: z.infer<typeof PortfolioItemInput>) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({ ...input, creator_id: me.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removePortfolioItem(user: SessionUser, id: string) {
  const supabase = await createUserClient();
  const me = await getMyCreator(user);
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id).eq("creator_id", me.id);
  if (error) throw error;
}

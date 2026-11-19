import "server-only";
import { env } from "@/lib/env";
import type { BrandProfileInput } from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

/** Own brand, or null before setup. Contacts are the owner's own (RLS). */
export async function findMyBrand(user: SessionUser) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*, brand_contacts(instagram, phone, email)")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyBrand(user: SessionUser) {
  const brand = await findMyBrand(user);
  if (!brand) throw errors.notFound("brand");
  return brand;
}

/** Only files the user uploaded to our logos bucket (their own folder) are accepted. */
function assertOwnLogo(user: SessionUser, url: string | null) {
  if (!url) return;
  const prefix = `${env.supabaseUrl}/storage/v1/object/public/logos/${user.id}/`;
  if (!url.startsWith(prefix)) throw errors.validation({ fieldErrors: { logo_url: ["validation.avatar"] } });
}

export async function createMyBrand(user: SessionUser, input: BrandProfileInput) {
  assertOwnLogo(user, input.logo_url);
  const supabase = await createUserClient();
  const { contact_instagram, contact_phone, contact_email, ...brand } = input;
  const { data, error } = await supabase
    .from("brands")
    .insert({ ...brand, profile_id: user.id })
    .select("id")
    .single();
  if (error?.code === "23505") throw errors.conflict("brand_exists");
  if (error) throw error;
  const { error: contactError } = await supabase
    .from("brand_contacts")
    .insert({ brand_id: data.id, instagram: contact_instagram, phone: contact_phone, email: contact_email });
  if (contactError) throw contactError;
  await track(user.id, "brand_profile_completed");
  return getMyBrand(user);
}

export async function updateMyBrand(user: SessionUser, input: BrandProfileInput) {
  assertOwnLogo(user, input.logo_url);
  const supabase = await createUserClient();
  const me = await getMyBrand(user);
  const { contact_instagram, contact_phone, contact_email, ...brand } = input;
  const { error } = await supabase.from("brands").update(brand).eq("id", me.id);
  if (error) throw error;
  const { error: contactError } = await supabase
    .from("brand_contacts")
    .upsert({ brand_id: me.id, instagram: contact_instagram, phone: contact_phone, email: contact_email });
  if (contactError) throw contactError;
  return getMyBrand(user);
}

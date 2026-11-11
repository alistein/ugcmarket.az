import "server-only";
import type { BrandProfileInput } from "@/schemas";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

export async function getMyBrand(user: SessionUser) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*, brand_contacts(instagram, phone)")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("brand");
  return data;
}

export async function createMyBrand(user: SessionUser, input: BrandProfileInput) {
  const supabase = await createUserClient();
  const { contact_instagram, contact_phone, ...brand } = input;
  const { data, error } = await supabase
    .from("brands")
    .insert({ ...brand, profile_id: user.id })
    .select()
    .single();
  if (error?.code === "23505") throw errors.conflict("brand_exists");
  if (error) throw error;
  await supabase.from("brand_contacts").insert({ brand_id: data.id, instagram: contact_instagram, phone: contact_phone });
  await track(user.id, "brand_profile_completed");
  return data;
}

export async function updateMyBrand(user: SessionUser, input: Partial<BrandProfileInput>) {
  const supabase = await createUserClient();
  const me = await getMyBrand(user);
  const { contact_instagram, contact_phone, ...brand } = input;
  if (Object.keys(brand).length) {
    const { error } = await supabase.from("brands").update(brand).eq("id", me.id);
    if (error) throw error;
  }
  if (contact_instagram !== undefined || contact_phone !== undefined) {
    await supabase.from("brand_contacts").upsert({ brand_id: me.id, instagram: contact_instagram, phone: contact_phone });
  }
  return getMyBrand(user);
}

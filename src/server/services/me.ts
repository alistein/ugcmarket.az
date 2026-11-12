import "server-only";
import { track } from "@/server/analytics";
import type { SessionUser } from "@/server/auth";
import { createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";

export async function getMe(user: SessionUser) {
  const supabase = await createUserClient();
  const [{ data: creator }, { data: brand }] = await Promise.all([
    supabase.from("creators").select("id, handle, review_status").eq("profile_id", user.id).maybeSingle(),
    supabase.from("brands").select("id, name, review_status").eq("profile_id", user.id).maybeSingle(),
  ]);
  return { ...user, creator, brand };
}

/**
 * Onboarding: role can be chosen once (brand or creator). Admins are set manually in the DB.
 * The DB enforces "once" too (set_my_role) — users can't update profiles.role directly.
 */
export async function setRole(user: SessionUser, role: "brand" | "creator") {
  if (user.role) throw errors.conflict("role_already_set");
  const supabase = await createUserClient();
  const { error } = await supabase.rpc("set_my_role", { new_role: role });
  if (error?.message === "role_already_set") throw errors.conflict("role_already_set");
  if (error) throw error;
  await track(user.id, "role_selected", { role });
}

export async function setLocale(user: SessionUser, locale: "az" | "ru" | "en") {
  const supabase = await createUserClient();
  const { error } = await supabase.from("profiles").update({ locale }).eq("id", user.id);
  if (error) throw error;
}

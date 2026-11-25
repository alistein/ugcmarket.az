import "server-only";
import { createUserClient } from "@/server/db/supabase";
import { errors } from "@/server/http/errors";
import type { Role } from "@/schemas/common";

export type SessionUser = { id: string; email: string | null; role: Role | null; status: string };

/** Current user from the verified JWT + their profile row, or null. */
export async function getUser(): Promise<SessionUser | null> {
  const supabase = await createUserClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", claims.sub)
    .maybeSingle();
  if (error) throw error;
  // Every auth user gets a profile row (trigger), so no row means the account was deleted while
  // its token is still valid (up to an hour). Treat it as signed out and drop the cookie, or the
  // proxy keeps seeing a session and onboarding loops on a role that can never be set.
  if (!profile) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return null;
  }

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    role: (profile.role as Role | null) ?? null, // null = signed up, hasn't picked a role yet
    status: profile.status ?? "active",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) throw errors.unauthorized();
  if (user.status === "blocked") throw errors.forbidden();
  return user;
}

/** Throws 401/403 unless the user has one of the given roles. Admin passes every check. */
export async function requireRole(...roles: Role[]): Promise<SessionUser & { role: Role }> {
  const user = await requireUser();
  if (!user.role || (user.role !== "admin" && !roles.includes(user.role))) throw errors.forbidden();
  return user as SessionUser & { role: Role };
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    role: (profile?.role as Role | undefined) ?? null, // null = signed up, hasn't picked a role yet
    status: profile?.status ?? "active",
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

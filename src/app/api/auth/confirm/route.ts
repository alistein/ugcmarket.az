import type { EmailOtpType } from "@supabase/supabase-js";
import { connection } from "next/server";
import { authRedirect, localeOf, loginWithError, nextOf } from "@/server/auth/redirects";
import { createUserClient } from "@/server/db/supabase";

const TYPES: EmailOtpType[] = ["email", "signup", "magiclink", "recovery", "email_change"];

/**
 * Fallback link in auth emails (the code is the primary path). Works across devices because it
 * verifies a token_hash instead of a PKCE code. Recovery → set-new-password step.
 */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const locale = localeOf(request, url.searchParams.get("next"));
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (!token_hash || !type || !TYPES.includes(type)) return loginWithError(request, locale, "link_invalid");

  const supabase = await createUserClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });
  if (error) return loginWithError(request, locale, "link_expired");

  if (type === "recovery") return authRedirect(request, `/${locale}/reset-password?step=update`);
  return authRedirect(request, nextOf(request, locale));
}

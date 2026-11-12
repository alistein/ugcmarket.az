import { connection } from "next/server";
import { authRedirect, localeOf, loginWithError, nextOf } from "@/server/auth/redirects";
import { createUserClient } from "@/server/db/supabase";

/**
 * OAuth (Google) PKCE callback: exchanges `code` for a session cookie, then sends the user
 * to a validated `next` (same-origin only). Errors land on /login with an i18n error key.
 */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const locale = localeOf(request, url.searchParams.get("next"));

  // Provider-side failure, e.g. the user closed the Google consent screen.
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return loginWithError(request, locale, providerError === "access_denied" ? "oauth_cancelled" : "oauth_failed");
  }

  const code = url.searchParams.get("code");
  if (!code) return loginWithError(request, locale, "link_invalid");

  const supabase = await createUserClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Most common cause: link opened in a different browser than the one that started the flow.
  if (error) return loginWithError(request, locale, "link_invalid");

  return authRedirect(request, nextOf(request, locale));
}

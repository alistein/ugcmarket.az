import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { isGuestOnlyPath, isProtectedPath, safeNext, splitLocale } from "@/lib/auth-routes";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createIntlMiddleware(routing);

/** Redirect while keeping any refreshed auth cookies from `from`. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export async function proxy(request: NextRequest) {
  // API routes: no locale prefix, only refresh the Supabase session cookie.
  // Auth for APIs is enforced in the route (requireUser/requireRole) → JSON 401/403, never redirects.
  if (request.nextUrl.pathname.startsWith("/api")) {
    return (await updateSession(request, NextResponse.next({ request }))).response;
  }

  // Pages: resolve locale (/az, /ru, /en), then refresh the session on that response.
  const { response, userId } = await updateSession(request, handleI18n(request));
  if (response.headers.has("location")) return response; // next-intl redirect (e.g. / → /az)

  // Optimistic guards (cookie/JWT only). Roles are checked by RoleGate + API + RLS.
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);
  if (!locale) return response;

  if (!userId && isProtectedPath(path)) {
    const url = new URL(`/${locale}/login`, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }
  if (userId && isGuestOnlyPath(path)) {
    const next = safeNext(request.nextUrl.searchParams.get("next"), `/${locale}/onboarding`);
    return redirectWithCookies(new URL(next, request.url), response);
  }
  if (userId && isProtectedPath(path)) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};

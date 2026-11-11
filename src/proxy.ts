import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // API routes: no locale prefix, only refresh the Supabase session cookie.
  if (request.nextUrl.pathname.startsWith("/api")) {
    return updateSession(request, NextResponse.next({ request }));
  }
  // Pages: resolve locale (/az, /ru, /en), then refresh the session on that response.
  return updateSession(request, handleI18n(request));
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};

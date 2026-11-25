import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth cookie on every request. Used only by src/proxy.ts.
 * Returns the verified user id (or null) for optimistic route guards — no DB access here.
 *
 * `makeResponse` runs after the refresh on purpose: a refreshed token is written onto the request
 * first, so the response that forwards the request (NextResponse.next / next-intl) hands the new
 * cookie to the route handler. Built earlier, the handler would see the old token and refresh again.
 */
export async function updateSession(
  request: NextRequest,
  makeResponse: () => NextResponse,
): Promise<{ response: NextResponse; userId: string | null }> {
  type Cookie = { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] };
  const refreshed: Cookie[] = [];
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies, headers) => {
        cookies.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          refreshed.push({ name, value, options });
        });
        // A response that sets auth cookies must never be cached or shared.
        cacheHeaders = { ...cacheHeaders, ...headers };
      },
    },
  });
  // Do not remove: validates the JWT and triggers a token refresh when needed.
  const { data } = await supabase.auth.getClaims();

  const response = makeResponse();
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  Object.entries(cacheHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return { response, userId: (data?.claims?.sub as string | undefined) ?? null };
}

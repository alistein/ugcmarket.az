import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/** Refreshes the Supabase auth cookie on every request. Used only by src/proxy.ts. */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  // Do not remove: validates the JWT and triggers a token refresh when needed.
  await supabase.auth.getClaims();
  return response;
}

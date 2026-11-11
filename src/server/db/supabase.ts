import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { serverEnv } from "@/server/env";
import type { Database } from "@/types/database";

/** Acts as the signed-in user. RLS applies. Use in API routes by default. */
export async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context that can't set cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}

/** Anonymous, cookie-less client for public reads (e.g. generateMetadata). RLS applies. */
export function createPublicClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/** Bypasses RLS. Admin actions and system jobs ONLY — never pass user input unchecked. */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

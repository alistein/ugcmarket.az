"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser client — ONLY for auth flows (sign in/up, sign out, OAuth) and direct
 * uploads to signed URLs. All data reads/writes go through /api.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}

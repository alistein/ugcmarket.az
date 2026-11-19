"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser client — ONLY for auth flows (sign in/up, sign out, OAuth) and direct
 * uploads to signed URLs. All data reads/writes go through /api.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    global: { fetch: fetchWithTimeout },
  });
}

/** Auth calls give up after this long instead of leaving a button spinning on a dead connection. */
export const AUTH_TIMEOUT_MS = 20_000;

/**
 * supabase-js has no request timeout. On a flaky connection a sign-in could wait forever;
 * aborting turns it into a retryable "network" error the form can show.
 */
export function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const timeout = AbortSignal.timeout(AUTH_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

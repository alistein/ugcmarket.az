"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { meKeys } from "@/features/me/hooks";
import { useRouter } from "@/i18n/navigation";
import { safeNext, stripLocale } from "@/lib/auth-routes";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { AuthFlowError, toAuthFlowError } from "./errors";

/**
 * Auth flows run in the browser against Supabase Auth directly (PKCE). This is the agreed
 * exception to "all data through /api": Supabase's per-IP rate limits and the session cookie
 * both need the real client. Everything after sign-in goes through /api.
 */

const supabase = () => createClient();

/** Throws AuthFlowError (i18n key) instead of raw Supabase errors. */
async function run<R extends { error: unknown }>(fn: () => Promise<R>): Promise<R> {
  try {
    const result = await fn();
    if (result.error) throw result.error;
    return result;
  } catch (e) {
    throw toAuthFlowError(e);
  }
}

/** Absolute callback URL; `next` is kept locale-prefixed and re-validated on the server. */
function callbackUrl(next: string) {
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

/** Resolves `?next=` to a safe, locale-prefixed path (default: onboarding → routes by role). */
export function useNextPath(rawNext: string | null) {
  const locale = useLocale();
  return safeNext(rawNext, `/${locale}/onboarding`);
}

/** After any successful sign-in: refresh `me`, then go to `next`. */
export function useAfterAuth(next: string) {
  const qc = useQueryClient();
  const router = useRouter();
  return useCallback(async () => {
    await qc.invalidateQueries({ queryKey: meKeys.all });
    router.replace(stripLocale(next));
  }, [qc, router, next]);
}

export function useSignInWithPassword() {
  return useMutation({
    mutationFn: async (v: { email: string; password: string }) => {
      try {
        return await run(() => supabase().auth.signInWithPassword(v));
      } catch (e) {
        // Unconfirmed email: send a fresh code so the verify screen is immediately useful.
        if (env.authEmail && e instanceof AuthFlowError && e.key === "email_not_confirmed") {
          await supabase()
            .auth.resend({ type: "signup", email: v.email })
            .catch(() => {});
        }
        throw e;
      }
    },
  });
}

export function useSignUp(next: string) {
  return useMutation({
    mutationFn: (v: { email: string; password: string }) =>
      run(() => supabase().auth.signUp({ ...v, options: { emailRedirectTo: callbackUrl(next) } })),
  });
}

/** Passwordless: 6-digit code by email. Creates the account if it doesn't exist (no enumeration). */
export function useSendEmailCode(next: string) {
  return useMutation({
    mutationFn: (email: string) =>
      run(() =>
        supabase().auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo: callbackUrl(next) },
        }),
      ),
  });
}

/** `email` for passwordless codes, `signup` for confirming a password sign-up, `recovery` for reset. */
export type CodeType = Extract<EmailOtpType, "email" | "signup" | "recovery">;

export function useVerifyEmailCode(type: CodeType) {
  return useMutation({
    mutationFn: async (v: { email: string; code: string }) => {
      const { data } = await run(() => supabase().auth.verifyOtp({ email: v.email, token: v.code, type }));
      if (!data.session) throw new AuthFlowError("code_invalid");
      return data;
    },
  });
}

/** Resend for each code type (Supabase enforces its own cooldown; the UI shows a 60s timer). */
export function useResendCode(type: CodeType, next: string) {
  return useMutation({
    mutationFn: async (email: string) => {
      const auth = supabase().auth;
      if (type === "signup") {
        return run(() =>
          auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl(next) } }),
        );
      }
      if (type === "recovery") return run(() => auth.resetPasswordForEmail(email));
      return run(() =>
        auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo: callbackUrl(next) },
        }),
      );
    },
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => run(() => supabase().auth.resetPasswordForEmail(email)),
  });
}

/** Requires a session (recovery code or link). */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (password: string) => run(() => supabase().auth.updateUser({ password })),
  });
}

/**
 * Google Identity Services: Google hands the ID token to our page, Supabase verifies it.
 * `nonce` is the raw value; Google got its SHA-256 hash.
 */
export function useSignInWithGoogleIdToken() {
  return useMutation({
    mutationFn: async (v: { token: string; nonce: string }) => {
      try {
        return await run(() =>
          supabase().auth.signInWithIdToken({ provider: "google", token: v.token, nonce: v.nonce }),
        );
      } catch (e) {
        const err = toAuthFlowError(e);
        throw err.key === "unknown" ? new AuthFlowError("oauth_failed") : err;
      }
    },
  });
}

/** Redirect flow through Supabase. Fallback when Google Identity Services is unavailable. */
export function useSignInWithGoogle(next: string) {
  return useMutation({
    mutationFn: () =>
      run(() =>
        supabase().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl(next), queryParams: { prompt: "select_account" } },
        }),
      ),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    // scope "local": this device only. Clear every cached query so no previous-user data lingers.
    mutationFn: () => run(() => supabase().auth.signOut({ scope: "local" })),
    onSettled: () => {
      qc.clear();
      router.replace("/login");
    },
  });
}

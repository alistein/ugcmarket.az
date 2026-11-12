import "server-only";
import { NextResponse } from "next/server";
import { type Locale, routing, toLocale } from "@/i18n/routing";
import { safeNext, splitLocale } from "@/lib/auth-routes";

/** Locale for auth redirects: from `next` ("/ru/…"), else the next-intl cookie, else default. */
export function localeOf(request: Request, next: string | null): Locale {
  const fromNext = next ? splitLocale(next).locale : null;
  if (fromNext) return fromNext;
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
  return cookie ? toLocale(cookie) : routing.defaultLocale;
}

export function authRedirect(request: Request, path: string) {
  const res = NextResponse.redirect(new URL(path, request.url));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/** Validated post-auth destination; defaults to onboarding (which routes by role). */
export function nextOf(request: Request, locale: Locale) {
  return safeNext(new URL(request.url).searchParams.get("next"), `/${locale}/onboarding`);
}

/** `error` is an i18n key suffix under auth.errors. */
export const loginWithError = (request: Request, locale: Locale, error: string) =>
  authRedirect(request, `/${locale}/login?error=${encodeURIComponent(error)}`);

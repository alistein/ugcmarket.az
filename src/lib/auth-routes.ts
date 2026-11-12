import { type Locale, routing } from "@/i18n/routing";

/**
 * Route guarding rules shared by src/proxy.ts (optimistic, cookie-only) and the client
 * (RoleGate, auth pages). Real enforcement stays in requireRole() + RLS.
 */

/** Need a session. Role checks happen in RoleGate (client) and requireRole (API). */
export const PROTECTED_PREFIXES = ["/me", "/brand", "/admin", "/onboarding"] as const;
/** Signed-in users are bounced away from these. */
export const GUEST_ONLY_PREFIXES = ["/login", "/signup"] as const;

const matches = (path: string, prefixes: readonly string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export const isProtectedPath = (path: string) => matches(path, PROTECTED_PREFIXES);
export const isGuestOnlyPath = (path: string) => matches(path, GUEST_ONLY_PREFIXES);

export type AppRole = "brand" | "creator" | "admin";

/** Where a signed-in user lands. No role yet → onboarding. */
export function homeFor(role: AppRole | null | undefined): "/me" | "/brand" | "/admin" | "/onboarding" {
  if (role === "creator") return "/me";
  if (role === "brand") return "/brand";
  if (role === "admin") return "/admin";
  return "/onboarding";
}

/** "/az/brand?x=1" → { locale: "az", path: "/brand" }. locale is null when not prefixed. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first as Locale, path: `/${rest.join("/")}` };
  }
  return { locale: null, path: pathname };
}

/**
 * Open-redirect guard for `?next=`. Only same-origin relative paths survive:
 * rejects "//evil.com", "/\evil.com", "https://…", "javascript:", control chars, and anything
 * that resolves to another origin.
 */
export function safeNext(raw: string | null | undefined, fallback: string): string {
  if (!raw || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  try {
    const base = "http://internal.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return fallback;
    // Never bounce back into the auth API (loops) or other API routes.
    if (url.pathname.startsWith("/api/")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Client side: `?next=` is stored locale-prefixed ("/az/brand"); the i18n router adds the
 * locale itself, so strip it. Always run through safeNext first.
 */
export function stripLocale(next: string): string {
  const { locale } = splitLocale(next.split(/[?#]/)[0]);
  if (!locale) return next;
  const rest = next.slice(locale.length + 1);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

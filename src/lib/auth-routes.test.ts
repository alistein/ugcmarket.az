import { describe, expect, it } from "vitest";
import {
  homeFor,
  isGuestOnlyPath,
  isProtectedPath,
  safeNext,
  splitLocale,
  stripLocale,
  viaOnboarding,
} from "./auth-routes";

describe("safeNext (open-redirect guard)", () => {
  const fallback = "/az/onboarding";

  it.each([
    ["/az/brand", "/az/brand"],
    ["/ru/me/profile?tab=prices#socials", "/ru/me/profile?tab=prices#socials"],
    ["/az/onboarding?role=creator", "/az/onboarding?role=creator"],
  ])("keeps same-origin path %s", (raw, expected) => {
    expect(safeNext(raw, fallback)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "//evil.com",
    "/\\evil.com",
    "https://evil.com/az/brand",
    "javascript:alert(1)",
    "evil.com",
    "/api/auth/callback",
    "/az/brand\u0000",
    `/${"a".repeat(600)}`,
  ])("falls back for %s", (raw) => {
    expect(safeNext(raw, fallback)).toBe(fallback);
  });
});

describe("locale helpers", () => {
  it("splits a locale prefix", () => {
    expect(splitLocale("/ru/brand")).toEqual({ locale: "ru", path: "/brand" });
    expect(splitLocale("/brand")).toEqual({ locale: null, path: "/brand" });
  });

  it("strips the locale for the i18n router", () => {
    expect(stripLocale("/az/onboarding")).toBe("/onboarding");
    expect(stripLocale("/az/onboarding?role=brand")).toBe("/onboarding?role=brand");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/me")).toBe("/me");
  });
});

describe("guards", () => {
  it("routes each role home; no role → onboarding", () => {
    expect(homeFor("creator")).toBe("/me");
    expect(homeFor("brand")).toBe("/brand");
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor(null)).toBe("/onboarding");
  });

  it("knows protected and guest-only paths", () => {
    expect(isProtectedPath("/onboarding")).toBe(true);
    expect(isProtectedPath("/me/profile")).toBe(true);
    expect(isProtectedPath("/media")).toBe(false);
    expect(isGuestOnlyPath("/signup")).toBe(true);
    expect(isGuestOnlyPath("/verify-email")).toBe(false);
  });
});

describe("viaOnboarding (post-auth destination)", () => {
  it("wraps any other destination so the role pick is never skipped", () => {
    expect(viaOnboarding("/ru/campaigns/abc?x=1", "az")).toBe(
      "/ru/onboarding?next=%2Fru%2Fcampaigns%2Fabc%3Fx%3D1",
    );
  });

  it("uses the fallback locale for an unprefixed path", () => {
    expect(viaOnboarding("/campaigns", "az")).toBe("/az/onboarding?next=%2Fcampaigns");
  });

  it("leaves onboarding itself alone", () => {
    expect(viaOnboarding("/az/onboarding", "ru")).toBe("/az/onboarding");
    expect(viaOnboarding("/az/onboarding?role=brand", "az")).toBe("/az/onboarding?role=brand");
  });
});

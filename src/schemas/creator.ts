import { z } from "zod";
import { Currency, Handle, PostFormat, SocialNetwork } from "./common";
import {
  City,
  ContentLanguage,
  CreatorCategory,
  CreatorSkill,
  EnabledNetwork,
  Gender,
  ShootOption,
  isEnabledNetwork,
  normalizeCategories,
} from "./taxonomy";

/**
 * Creator profile schemas — shared by the profile forms and /api/creators*.
 * Messages are i18n keys (validation.*). No .default() here: PATCH must not reset omitted
 * fields (zod v4 applies defaults inside .partial()); the DB holds the defaults.
 */

const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "me",
  "brand",
  "brands",
  "creator",
  "creators",
  "campaigns",
  "login",
  "signup",
  "onboarding",
  "settings",
  "support",
  "help",
  "about",
  "ugcmarket",
  "ugc",
  "official",
  "team",
]);

/** Public URL handle: lowercased, a–z 0–9 . _ (3–30), not reserved. */
export const CreatorHandle = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(Handle)
  .refine((h) => !RESERVED_HANDLES.has(h), "validation.handleReserved");

/** Accepts "@name", "name" or a profile URL; stores the bare username. */
export const SocialUsername = z
  .string()
  .trim()
  .transform(
    (v) =>
      v
        .replace(/^https?:\/\/(www\.|m\.|vm\.)?(instagram\.com|tiktok\.com|youtube\.com)\/(@)?/i, "")
        .replace(/^@/, "")
        .split(/[/?#]/)[0],
  )
  .pipe(z.string().regex(/^[A-Za-z0-9._-]{1,60}$/, "validation.socialHandle"));

const Count = (max: number) =>
  z.coerce
    .number({ error: "validation.number" })
    .int("validation.number")
    .min(0, "validation.number")
    .max(max, "validation.number");

export const CreatorSocialInput = z.object({
  network: EnabledNetwork,
  handle: SocialUsername,
  /** Missing at sign-up: the numbers are looked up right after the profile is created. */
  followers: Count(500_000_000).optional(),
  avg_views: Count(500_000_000).optional(),
});
export type CreatorSocialInput = z.infer<typeof CreatorSocialInput>;

export const CreatorPriceInput = z.object({
  format: PostFormat,
  amount: z.coerce
    .number({ error: "validation.number" })
    .min(0, "validation.number")
    .max(1_000_000, "validation.number"),
  currency: Currency,
});
export type CreatorPriceInput = z.infer<typeof CreatorPriceInput>;

const uniqueBy =
  <T>(key: (t: T) => string) =>
  (list: T[]) =>
    new Set(list.map(key)).size === list.length;

export const CreatorSocials = z
  .array(CreatorSocialInput)
  .max(3)
  .refine(
    uniqueBy<CreatorSocialInput>((s) => s.network),
    "validation.duplicate",
  );
export const CreatorPrices = z
  .array(CreatorPriceInput)
  .max(10)
  .refine(
    uniqueBy<CreatorPriceInput>((p) => p.format),
    "validation.duplicate",
  );

/** Creators are 16 to 80. Checked against the current year, so it moves with time. */
export const MIN_CREATOR_AGE = 16;
export const MAX_CREATOR_AGE = 80;
export const BirthYear = z.coerce
  .number({ error: "validation.birthYear" })
  .int("validation.birthYear")
  .refine((y) => {
    const age = new Date().getFullYear() - y;
    return age >= MIN_CREATOR_AGE && age <= MAX_CREATOR_AGE;
  }, "validation.birthYear");

export const Phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ()-]{6,19}$/, "validation.phone");

const profileShape = {
  handle: CreatorHandle,
  display_name: z.string().trim().min(1, "validation.required").max(80, "validation.tooLong"),
  /** Must be our own avatars bucket URL — checked again in the service. */
  avatar_url: z.url().nullable(),
  city: City,
  gender: Gender,
  birth_year: BirthYear,
  /** Content directions. Old slugs (still in a cached form) are mapped to their new home. */
  categories: z.preprocess(
    (v) => (Array.isArray(v) ? normalizeCategories(v) : v),
    z.array(CreatorCategory).min(1, "validation.categoriesMin").max(40),
  ),
  languages: z.array(ContentLanguage).min(1, "validation.languagesMin").max(6),
  bio: z.string().trim().max(600, "validation.tooLong").nullable(),
  paid_open: z.boolean(),
  barter_open: z.boolean(),
  /** "Kollaborasiya" in copy: free work in exchange for the brand sharing it. */
  repost_open: z.boolean(),
  shoot_options: z.array(ShootOption).max(5),
  skills: z.array(CreatorSkill).max(10),
  /** Private — only revealed to a brand through the application flow. */
  contact_instagram: SocialUsername.nullable(),
  contact_phone: Phone.nullable(),
  socials: CreatorSocials,
  prices: CreatorPrices,
};

export const CreatorProfileInput = z.object({
  ...profileShape,
  avatar_url: profileShape.avatar_url.optional(),
  bio: profileShape.bio.optional(),
  paid_open: profileShape.paid_open.optional(),
  barter_open: profileShape.barter_open.optional(),
  repost_open: profileShape.repost_open.optional(),
  shoot_options: profileShape.shoot_options.optional(),
  skills: profileShape.skills.optional(),
  contact_instagram: profileShape.contact_instagram.optional(),
  contact_phone: profileShape.contact_phone.optional(),
  socials: profileShape.socials.optional(),
  prices: profileShape.prices.optional(),
});
export type CreatorProfileInput = z.infer<typeof CreatorProfileInput>;

export const CreatorProfileUpdate = z.object(profileShape).partial();
export type CreatorProfileUpdate = z.infer<typeof CreatorProfileUpdate>;

/** Portfolio link: https on Instagram / TikTok / YouTube; the network is derived from the host. */
const HOSTS: Record<string, z.infer<typeof SocialNetwork>> = {
  "instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "vm.tiktok.com": "tiktok",
  "vt.tiktok.com": "tiktok",
  "youtube.com": "youtube",
  "m.youtube.com": "youtube",
  "youtu.be": "youtube",
};

/** Parse what people paste: spaces around it, no "https://", "www." or not. */
function parseLink(raw: string) {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

export function networkOfUrl(raw: string): z.infer<typeof SocialNetwork> | null {
  const url = parseLink(raw);
  return url ? (HOSTS[url.hostname.toLowerCase().replace(/^www\./, "")] ?? null) : null;
}

/**
 * Why a pasted portfolio link can't be used, as the i18n key that explains the fix. Every case
 * the creator can correct is caught here, before anything is sent (see creator.test.ts).
 */
export const PORTFOLIO_URL_ISSUES = [
  "validation.portfolioEmpty",
  "validation.portfolioNotLink",
  "validation.portfolioUnsupported",
  "validation.portfolioNetworkSoon",
  "validation.portfolioProfile",
  "validation.portfolioStory",
  "validation.portfolioNotPost",
] as const;
export type PortfolioUrlIssue = (typeof PORTFOLIO_URL_ISSUES)[number];

/** Instagram paths that point at one post: /reel/ID, /p/ID, /tv/ID, also with the account first. */
const IG_POST = /^\/(?:([\w.]+)\/)?(?:reel|reels|p|tv)\/([\w-]{5,})\/?$/i;

/**
 * Check a pasted link and turn it into the one form we store (so the same Reel shared from the app,
 * the website or with tracking parameters counts as one link).
 */
export function checkPortfolioUrl(raw: string):
  | {
      ok: true;
      network: z.infer<typeof SocialNetwork>;
      url: string;
      /** Account named in the link ("/natgeo/reel/…"), when there is one: lets us refuse someone
       * else's post without looking it up. Most links copied from the app don't carry it. */
      account: string | null;
    }
  | { ok: false; issue: PortfolioUrlIssue } {
  if (!raw.trim()) return { ok: false, issue: "validation.portfolioEmpty" };
  const url = parseLink(raw);
  if (!url) return { ok: false, issue: "validation.portfolioNotLink" };
  const network = HOSTS[url.hostname.toLowerCase().replace(/^www\./, "")];
  if (!network) return { ok: false, issue: "validation.portfolioUnsupported" };
  if (!isEnabledNetwork(network)) return { ok: false, issue: "validation.portfolioNetworkSoon" };

  // Instagram (the only live network for now).
  const path = url.pathname.replace(/\/{2,}/g, "/");
  if (/^\/stories\//i.test(path)) return { ok: false, issue: "validation.portfolioStory" };
  const post = path.match(IG_POST);
  if (post) {
    const kind = /\/p\//i.test(path) ? "p" : "reel";
    return {
      ok: true,
      network,
      url: `https://www.instagram.com/${kind}/${post[2]}/`,
      account: post[1]?.toLowerCase() ?? null,
    };
  }
  const parts = path.split("/").filter(Boolean);
  const reserved = ["explore", "reels", "direct", "accounts", "about", "legal", "p", "reel", "tv"];
  // "/natgeo" or "/natgeo/reels" (the profile or its Reels tab), not one post.
  if (parts.length >= 1 && parts.length <= 2 && !reserved.includes(parts[0].toLowerCase()))
    return { ok: false, issue: "validation.portfolioProfile" };
  return { ok: false, issue: "validation.portfolioNotPost" };
}

export const PortfolioItemInput = z
  .object({
    url: z.string().max(500, "validation.tooLong"),
    title: z.string().trim().max(100, "validation.tooLong").optional(),
  })
  .transform((v, ctx) => {
    const checked = checkPortfolioUrl(v.url);
    if (!checked.ok) {
      ctx.addIssue({ code: "custom", path: ["url"], message: checked.issue });
      return z.NEVER;
    }
    return { ...v, url: checked.url, network: checked.network, account: checked.account };
  });
export type PortfolioItemInput = z.input<typeof PortfolioItemInput>;
export type PortfolioItem = z.output<typeof PortfolioItemInput>;

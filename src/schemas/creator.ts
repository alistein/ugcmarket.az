import { z } from "zod";
import { Currency, Handle, PostFormat, SocialNetwork } from "./common";
import { City, ContentLanguage, CreatorCategory, EnabledNetwork, isEnabledNetwork } from "./taxonomy";

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
  followers: Count(500_000_000),
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
  categories: z.array(CreatorCategory).min(1, "validation.categoriesMin").max(5, "validation.categoriesMax"),
  languages: z.array(ContentLanguage).min(1, "validation.languagesMin").max(6),
  bio: z.string().trim().max(600, "validation.tooLong").nullable(),
  barter_open: z.boolean(),
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
  barter_open: profileShape.barter_open.optional(),
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

export function networkOfUrl(raw: string): z.infer<typeof SocialNetwork> | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return HOSTS[url.hostname.replace(/^www\./, "")] ?? null;
  } catch {
    return null;
  }
}

export const PortfolioItemInput = z
  .object({
    url: z.string().trim().max(500, "validation.tooLong"),
    title: z.string().trim().max(100, "validation.tooLong").optional(),
  })
  .transform((v, ctx) => {
    const network = networkOfUrl(v.url);
    if (!network || !isEnabledNetwork(network)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "validation.portfolioUrl" });
      return z.NEVER;
    }
    return { ...v, network };
  });
export type PortfolioItemInput = z.input<typeof PortfolioItemInput>;
export type PortfolioItem = z.output<typeof PortfolioItemInput>;

import { z } from "zod";

/**
 * Fixed lists stored as slugs; labels live in messages under `taxonomy.*`.
 * Adding a value: add it here + in az/ru/en messages. Removing one: migrate existing rows first.
 */
export const CREATOR_CATEGORIES = [
  "lifestyle",
  "beauty",
  "fashion",
  "food",
  "restaurants",
  "home",
  "renovation",
  "family",
  "baby",
  "travel",
  "fitness",
  "health",
  "tech",
  "auto",
  "pets",
  "education",
  "business",
  "finance",
  "shopping",
  "entertainment",
  "gaming",
  "art_design",
  "music",
  "film_tv",
  "books",
  "photo_video",
  "apps",
  "real_estate",
  "events",
] as const;
export const CreatorCategory = z.enum(CREATOR_CATEGORIES);
export type CreatorCategory = z.infer<typeof CreatorCategory>;

/**
 * Directions merged into others on 2026-11-26 (migration content_directions). Old rows are
 * remapped in the database; this covers anything still cached in a browser or a link.
 */
export const LEGACY_CATEGORY: Record<string, CreatorCategory> = {
  skincare: "beauty",
  haircare: "beauty",
  jewelry: "fashion",
  electronics: "tech",
  humor: "entertainment",
};

/** Known directions only, old ones mapped to their new home, no duplicates, list order kept. */
export function normalizeCategories(values: readonly string[]): CreatorCategory[] {
  const mapped = new Set(values.map((v) => LEGACY_CATEGORY[v] ?? v));
  return CREATOR_CATEGORIES.filter((c) => mapped.has(c));
}

/** How a creator works with brands (onboarding content step). "collab" is the repost deal. */
export const DEAL_FORMATS = ["paid", "barter", "collab"] as const;
export type DealFormat = (typeof DEAL_FORMATS)[number];

/** Where the creator can film (Qiymətlər və şərtlər). */
export const SHOOT_OPTIONS = ["at_home", "at_brand_location"] as const;
export const ShootOption = z.enum(SHOOT_OPTIONS);

/** What the creator does themselves, so the brand needs no crew (Qiymətlər və şərtlər). */
export const CREATOR_SKILLS = [
  "photographer",
  "videographer",
  "makeup_artist",
  "stylist",
  "designer",
] as const;
export const CreatorSkill = z.enum(CREATOR_SKILLS);

/** What a brand does. Labels: `taxonomy.brandCategories.*`. */
export const BRAND_CATEGORIES = [
  "beauty",
  "fashion",
  "food",
  "home",
  "family",
  "fitness",
  "tech",
  "auto",
  "education",
  "travel",
  "pets",
  "services",
  "other",
] as const;
export const BrandCategory = z.enum(BRAND_CATEGORIES);
export type BrandCategory = z.infer<typeof BrandCategory>;

export const CITIES = [
  "baku",
  "sumgait",
  "ganja",
  "khirdalan",
  "mingachevir",
  "lankaran",
  "shaki",
  "quba",
  "shirvan",
  "nakhchivan",
  "other",
] as const;
export const City = z.enum(CITIES);

export const GENDERS = ["female", "male"] as const;
export const Gender = z.enum(GENDERS);
export type Gender = z.infer<typeof Gender>;
export type City = z.infer<typeof City>;

export const CONTENT_LANGUAGES = ["az", "ru", "en", "tr", "other"] as const;
export const ContentLanguage = z.enum(CONTENT_LANGUAGES);

/** Formats a creator can price; mirrors the post_format DB enum. */
export const PRICE_FORMATS = ["reels", "stories", "post", "tiktok_video", "youtube_short"] as const;

/**
 * Networks live in the product right now (founders, 2026-11-12: Instagram first; TikTok and
 * YouTube come soon). The DB enum and providers already support all three; to launch one,
 * add it here (and its formats to ENABLED_PRICE_FORMATS). Nothing else needs to change.
 */
export const ENABLED_NETWORKS = ["instagram"] as const;
export const EnabledNetwork = z.enum(ENABLED_NETWORKS);
export type EnabledNetwork = z.infer<typeof EnabledNetwork>;
export const isEnabledNetwork = (n: string): n is EnabledNetwork =>
  (ENABLED_NETWORKS as readonly string[]).includes(n);

/** Price formats offered in the form for the enabled networks. */
export const ENABLED_PRICE_FORMATS = [
  "reels",
  "stories",
  "post",
] as const satisfies readonly (typeof PRICE_FORMATS)[number][];

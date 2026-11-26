import { z } from "zod";

/**
 * Fixed lists stored as slugs; labels live in messages under `taxonomy.*`.
 * Adding a value: add it here + in az/ru/en messages. Removing one: migrate existing rows first.
 */
export const CREATOR_CATEGORIES = [
  "beauty",
  "fashion",
  "food",
  "lifestyle",
  "travel",
  "home",
  "family",
  "fitness",
  "tech",
  "auto",
  "education",
  "humor",
  "gaming",
  "pets",
  "music",
  "business",
  "health",
  "finance",
  "shopping",
  "restaurants",
  "entertainment",
  // Behind "Daha çox" in the form (MORE_CATEGORIES).
  "skincare",
  "haircare",
  "baby",
  "jewelry",
  "art_design",
  "photo_video",
  "film_tv",
  "books",
  "electronics",
  "apps",
  "real_estate",
] as const;
export const CreatorCategory = z.enum(CREATOR_CATEGORIES);
export type CreatorCategory = z.infer<typeof CreatorCategory>;
/** Shown only after "Daha çox", so the first screen stays short. */
export const MORE_CATEGORIES = [
  "skincare",
  "haircare",
  "baby",
  "jewelry",
  "art_design",
  "photo_video",
  "film_tv",
  "books",
  "electronics",
  "apps",
  "real_estate",
] as const satisfies readonly CreatorCategory[];

/** How a creator works with brands (onboarding content step). "collab" is the repost deal. */
export const DEAL_FORMATS = ["paid", "barter", "collab"] as const;
export type DealFormat = (typeof DEAL_FORMATS)[number];

/**
 * "Həyat tərzi və maraqlar" (enhancer): who the creator is and what they have, in groups.
 * Categories say what they make content about; these never repeat a category.
 */
export const LIFESTYLE_GROUPS = {
  education: ["student", "teacher"],
  occupation: ["employee", "entrepreneur", "freelancer", "homemaker"],
  family: ["single", "married", "has_kids"],
  pets: ["cat_owner", "dog_owner", "other_pet_owner"],
  transport: ["car_owner", "motorcycle_rider", "cyclist"],
  sport: ["athlete", "fitness_fan", "runner", "swimmer", "yoga", "pilates", "football_fan", "hiking"],
  hobbies: ["bookworm", "home_cook", "coffee_lover", "gardening", "crafts", "healthy_eating"],
  profession: ["chef", "barista", "fitness_coach", "it_specialist", "marketer", "musician"],
} as const;
export type LifestyleGroup = keyof typeof LIFESTYLE_GROUPS;
export const LIFESTYLE_TAGS = Object.values(LIFESTYLE_GROUPS).flat() as LifestyleTag[];
export type LifestyleTag = (typeof LIFESTYLE_GROUPS)[LifestyleGroup][number];
export const LifestyleTag = z.enum(LIFESTYLE_TAGS as [LifestyleTag, ...LifestyleTag[]]);
/** Subay and Ailəvi exclude each other; Uşaqlı goes with either. */
export const EXCLUSIVE_LIFESTYLE = [["single", "married"]] as const;

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
export const PRICE_FORMATS = [
  "reels",
  "stories",
  "post",
  "tiktok_video",
  "youtube_short",
] as const;

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

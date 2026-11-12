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
] as const;
export const CreatorCategory = z.enum(CREATOR_CATEGORIES);
export type CreatorCategory = z.infer<typeof CreatorCategory>;

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
export type City = z.infer<typeof City>;

export const CONTENT_LANGUAGES = ["az", "ru", "en", "tr"] as const;
export const ContentLanguage = z.enum(CONTENT_LANGUAGES);

/** Formats a creator can price; mirrors the post_format DB enum. */
export const PRICE_FORMATS = [
  "reels",
  "stories",
  "post",
  "tiktok_video",
  "youtube_short",
  "ugc_video",
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
  "ugc_video",
] as const satisfies readonly (typeof PRICE_FORMATS)[number][];

/** Most portfolio links a creator can keep. */
export const PORTFOLIO_MAX = 5;

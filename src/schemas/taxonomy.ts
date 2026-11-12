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

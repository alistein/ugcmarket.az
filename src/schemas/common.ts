import { z } from "zod";

export const roles = ["brand", "creator", "admin"] as const;
export const Role = z.enum(roles);
export type Role = z.infer<typeof Role>;

export const SocialNetwork = z.enum(["instagram", "tiktok", "youtube"]);
export type SocialNetwork = z.infer<typeof SocialNetwork>;

/**
 * Spec §1: influencer post. UGC production (video for the brand only) was removed (2026-11-25);
 * "ugc" stays in the DB enum but the API no longer accepts it.
 */
export const CollaborationModel = z.enum(["post"]);

/** Spec §6: compensation types. */
export const CompensationType = z.enum(["money", "product", "service", "barter", "unpaid", "bid"]);

/**
 * What a brand can pick for a listing (founders, 2026-11-19): paid, barter or offer-based (bid), in that order.
 * "product" and "service" stay in the DB enum but are folded into barter in the product.
 * "unpaid" was dropped from the form and board filter (2026-11-26); it stays in the DB enum for old rows.
 * "bid" (2026-11-23): creators name their price when applying; no budget ceiling (dropped 2026-11-26).
 */
export const LISTING_COMPENSATION_TYPES = ["money", "barter", "bid"] as const;
export const ListingCompensationType = z.enum(LISTING_COMPENSATION_TYPES);

export const PostFormat = z.enum(["reels", "stories", "post", "tiktok_video", "youtube_short", "other"]);

export const Currency = z.enum(["AZN", "USD", "EUR"]);

export const Locale = z.enum(["az", "ru", "en"]);

export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
});

export const Handle = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_.]+$/, "validation.handle");

/**
 * Empty form input → null: whitespace-only text, and undefined (an untouched select or a key the
 * client left out), so optional fields can stay plain inputs.
 */
export const blankToNull = (v: unknown) =>
  v === undefined || (typeof v === "string" && v.trim() === "") ? null : v;

import { z } from "zod";

export const roles = ["brand", "creator", "admin"] as const;
export const Role = z.enum(roles);
export type Role = z.infer<typeof Role>;

export const SocialNetwork = z.enum(["instagram", "tiktok", "youtube"]);
export type SocialNetwork = z.infer<typeof SocialNetwork>;

/** Spec §1: influencer post (primary) vs UGC production (secondary). */
export const CollaborationModel = z.enum(["post", "ugc"]);

/** Spec §6: compensation types. */
export const CompensationType = z.enum(["money", "product", "service", "barter", "unpaid"]);

export const PostFormat = z.enum(["reels", "stories", "post", "tiktok_video", "youtube_short", "ugc_video", "other"]);

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

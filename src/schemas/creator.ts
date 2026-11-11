import { z } from "zod";
import { Currency, Handle, PostFormat, SocialNetwork } from "./common";

export const CreatorSocialInput = z.object({
  network: SocialNetwork,
  handle: z.string().min(1).max(60),
  followers: z.coerce.number().int().min(0),
  avg_views: z.coerce.number().int().min(0).optional(),
});

export const CreatorPriceInput = z.object({
  format: PostFormat,
  amount: z.coerce.number().min(0),
  currency: Currency.default("AZN"),
});

export const CreatorProfileInput = z.object({
  handle: Handle,
  display_name: z.string().min(1).max(80),
  avatar_url: z.url().optional(),
  city: z.string().min(1).max(60),
  country: z.string().length(2).default("AZ"),
  categories: z.array(z.string()).min(1).max(5),
  languages: z.array(z.string()).min(1),
  bio: z.string().max(600).optional(),
  barter_open: z.boolean().default(false),
  contact_instagram: z.string().max(60).optional(),
  contact_phone: z.string().max(30).optional(),
});
export type CreatorProfileInput = z.infer<typeof CreatorProfileInput>;

export const CreatorProfileUpdate = CreatorProfileInput.partial().extend({
  socials: z.array(CreatorSocialInput).max(3).optional(),
  prices: z.array(CreatorPriceInput).max(10).optional(),
});

export const PortfolioItemInput = z.object({
  url: z.url(), // Instagram/TikTok/YouTube link — we don't host video
  network: SocialNetwork,
  title: z.string().max(100).optional(),
});

import { z } from "zod";

export const BrandProfileInput = z.object({
  name: z.string().min(1).max(80),
  logo_url: z.url().optional(),
  category: z.string().min(1).max(60),
  website: z.url().optional(),
  contact_instagram: z.string().max(60).optional(),
  contact_phone: z.string().max(30).optional(),
});
export type BrandProfileInput = z.infer<typeof BrandProfileInput>;

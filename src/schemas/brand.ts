import { z } from "zod";
import { blankToNull } from "./common";
import { Phone, SocialUsername } from "./creator";
import { BrandCategory } from "./taxonomy";

/** "nur.az" or "https://nur.az" → "https://nur.az". */
const Website = z.preprocess(
  (v) => {
    const b = blankToNull(v);
    if (typeof b !== "string") return b;
    const t = b.trim();
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  },
  z
    .url({ protocol: /^https?$/, hostname: z.regexes.domain, error: "validation.website" })
    .max(200, "validation.tooLong")
    .nullable(),
);

/** A required text input: empty (or missing) → "required", then the field's own rule. */
const Required = <T extends z.ZodType<unknown, string>>(rule: T) =>
  z.string({ error: "validation.required" }).trim().min(1, "validation.required").pipe(rule);

/**
 * Brand profile: one form for setup and edit (both send every field).
 * Contacts are all required (founders, 2026-11-19) and private: only creators who apply to a
 * listing see them. That is how creators reach the brand (the deal happens off-platform).
 */
export const BrandProfileInput = z.object({
  name: z.string().trim().min(1, "validation.required").max(80, "validation.tooLong"),
  /** Must be our own logos bucket URL; checked again in the service. */
  logo_url: z.url().nullable(),
  category: BrandCategory,
  website: Website,
  contact_instagram: Required(SocialUsername),
  contact_phone: Required(Phone),
  contact_email: Required(z.email("validation.email").toLowerCase().max(254, "validation.tooLong")),
});
export type BrandProfileInput = z.infer<typeof BrandProfileInput>;
/** Form values before parsing (plain strings; "" for empty fields). */
export type BrandProfileFormValues = z.input<typeof BrandProfileInput>;

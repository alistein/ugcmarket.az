import { z } from "zod";
import {
  City,
  ContentLanguage,
  CreatorCategory,
  CreatorHandle,
  ENABLED_NETWORKS,
  ENABLED_PRICE_FORMATS,
  PRICE_FORMATS,
  Phone,
  SocialUsername,
  type CreatorProfileInput,
} from "@/schemas";
import type { MyCreator, Network } from "./hooks";

/**
 * Form shape for the creator profile (setup wizard + edit). Inputs are strings; toPayload()
 * converts to the API schema, which the server validates again.
 */
/** Networks shown in the form: only the ones enabled in the product (see ENABLED_NETWORKS). */
export const NETWORKS = ENABLED_NETWORKS satisfies readonly Network[];

const optionalCount = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,9}$/.test(v.replace(/[\s.,]/g, "")), "validation.number");

const SocialRow = z
  .object({ handle: z.string().trim(), followers: optionalCount, avg_views: optionalCount })
  .superRefine((row, ctx) => {
    if (!row.handle) return;
    if (!SocialUsername.safeParse(row.handle).success) {
      ctx.addIssue({ code: "custom", path: ["handle"], message: "validation.socialHandle" });
    }
    if (!row.followers) ctx.addIssue({ code: "custom", path: ["followers"], message: "validation.required" });
  });

const price = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,7}([.,]\d{1,2})?$/.test(v), "validation.number");
const priceShape = {
  reels: price,
  stories: price,
  post: price,
  tiktok_video: price,
  youtube_short: price,
  ugc_video: price,
} satisfies Record<(typeof PRICE_FORMATS)[number], typeof price>;

export const CreatorForm = z.object({
  avatar_url: z.string().nullable(),
  display_name: z.string().trim().min(1, "validation.required").max(80, "validation.tooLong"),
  handle: CreatorHandle,
  city: z.union([City, z.literal("")]).refine((v) => v !== "", "validation.required"),
  bio: z.string().trim().max(600, "validation.tooLong"),
  categories: z.array(CreatorCategory).min(1, "validation.categoriesMin").max(5, "validation.categoriesMax"),
  languages: z.array(ContentLanguage).min(1, "validation.languagesMin"),
  barter_open: z.boolean(),
  socials: z
    .object({ instagram: SocialRow, tiktok: SocialRow, youtube: SocialRow })
    .refine((s) => NETWORKS.some((n) => s[n].handle), {
      message: "validation.socialsMin",
      path: ["instagram", "handle"],
    }),
  prices: z.object(priceShape),
  contact_instagram: z
    .string()
    .trim()
    .refine((v) => v === "" || SocialUsername.safeParse(v).success, "validation.socialHandle"),
  contact_phone: z
    .string()
    .trim()
    .refine((v) => v === "" || Phone.safeParse(v).success, "validation.phone"),
});
export type CreatorFormValues = z.input<typeof CreatorForm>;

/** Which fields each wizard step owns (validated with form.trigger before moving on). */
export const STEP_FIELDS = {
  about: ["avatar_url", "display_name", "handle", "city", "bio"],
  content: ["categories", "languages", "barter_open"],
  socials: ["socials", "contact_instagram", "contact_phone"],
  prices: ["prices"],
} as const;
export type Step = keyof typeof STEP_FIELDS;
export const STEPS = Object.keys(STEP_FIELDS) as Step[];

const emptyRow = { handle: "", followers: "", avg_views: "" };

export function emptyCreatorForm(): CreatorFormValues {
  return {
    avatar_url: null,
    display_name: "",
    handle: "",
    city: "",
    bio: "",
    categories: [],
    languages: ["az"],
    barter_open: false,
    socials: { instagram: { ...emptyRow }, tiktok: { ...emptyRow }, youtube: { ...emptyRow } },
    prices: Object.fromEntries(PRICE_FORMATS.map((f) => [f, ""])) as CreatorFormValues["prices"],
    contact_instagram: "",
    contact_phone: "",
  };
}

export function creatorToForm(c: MyCreator): CreatorFormValues {
  const base = emptyCreatorForm();
  for (const s of c.creator_socials) {
    if (!(NETWORKS as readonly string[]).includes(s.network)) continue;
    base.socials[s.network] = {
      handle: s.handle,
      followers: String(s.followers),
      avg_views: s.avg_views == null ? "" : String(s.avg_views),
    };
  }
  for (const p of c.creator_prices) {
    if (p.format in base.prices) base.prices[p.format as keyof typeof base.prices] = String(Number(p.amount));
  }
  return {
    ...base,
    avatar_url: c.avatar_url,
    display_name: c.display_name,
    handle: c.handle,
    city: City.safeParse(c.city).success ? (c.city as CreatorFormValues["city"]) : "",
    bio: c.bio ?? "",
    categories: c.categories.filter(
      (x) => CreatorCategory.safeParse(x).success,
    ) as CreatorFormValues["categories"],
    languages: c.languages.filter(
      (x) => ContentLanguage.safeParse(x).success,
    ) as CreatorFormValues["languages"],
    barter_open: c.barter_open,
    contact_instagram: c.contact_instagram ?? "",
    contact_phone: c.contact_phone ?? "",
  };
}

const toInt = (v: string) => Number(v.replace(/[\s.,]/g, ""));

export function toPayload(v: CreatorFormValues): CreatorProfileInput & { avatar_url: string | null } {
  return {
    avatar_url: v.avatar_url,
    display_name: v.display_name,
    handle: v.handle,
    city: v.city as z.infer<typeof City>,
    bio: v.bio || null,
    categories: v.categories,
    languages: v.languages,
    barter_open: v.barter_open,
    socials: NETWORKS.filter((n) => v.socials[n].handle).map((n) => ({
      network: n,
      handle: SocialUsername.parse(v.socials[n].handle),
      followers: toInt(v.socials[n].followers),
      ...(v.socials[n].avg_views ? { avg_views: toInt(v.socials[n].avg_views) } : {}),
    })),
    prices: ENABLED_PRICE_FORMATS.filter((f) => v.prices[f]).map((f) => ({
      format: f,
      amount: Number(v.prices[f].replace(",", ".")),
      currency: "AZN" as const,
    })),
    contact_instagram: v.contact_instagram ? SocialUsername.parse(v.contact_instagram) : null,
    contact_phone: v.contact_phone || null,
  };
}

/** "Aysel Məmmədova" → "aysel.memmedova" (Azerbaijani letters folded to ASCII). */
export function suggestHandle(name: string) {
  const map: Record<string, string> = { ə: "e", ı: "i", ş: "s", ç: "c", ğ: "g", ö: "o", ü: "u", İ: "i" };
  return name
    .toLowerCase()
    .replace(/[əışçğöüİ]/g, (c) => map[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 30);
}

/** Profile completeness for the dashboard checklist. */
export function completeness(c: MyCreator) {
  const items = [
    { key: "photo", done: !!c.avatar_url, section: "about" },
    { key: "bio", done: !!c.bio && c.bio.length >= 40, section: "about" },
    { key: "socials", done: c.creator_socials.length > 0, section: "socials" },
    { key: "prices", done: c.creator_prices.length > 0, section: "prices" },
    { key: "portfolio", done: c.portfolio_items.length >= 3, section: "portfolio" },
  ] as const;
  return { items, percent: Math.round((items.filter((i) => i.done).length / items.length) * 100) };
}

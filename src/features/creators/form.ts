import { z } from "zod";
import {
  BirthYear,
  City,
  ContentLanguage,
  CreatorCategory,
  CreatorHandle,
  CreatorSkill,
  DEAL_FORMATS,
  type DealFormat,
  LifestyleTag,
  LifestyleTags,
  ShootOption,
  ENABLED_NETWORKS,
  ENABLED_PRICE_FORMATS,
  Gender,
  PRICE_FORMATS,
  Phone,
  SocialUsername,
  type CreatorProfileInput,
} from "@/schemas";
import { type CreatorPublic, type MyCreator, type Network, socialNumbers } from "./hooks";

/** Whether a creator takes this kind of deal ("collab" is the repost deal). */
export function dealOpen(c: Pick<CreatorPublic, "paid_open" | "barter_open" | "repost_open">, f: DealFormat) {
  return f === "paid" ? c.paid_open : f === "barter" ? c.barter_open : c.repost_open;
}

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

/**
 * One network row. Editing a profile: numbers come only from "connect account" (API lookup), so
 * typing a handle isn't enough. Sign-up asks for the username only; the server looks it up on create.
 */
const socialRow = (requireLookup: boolean) =>
  z
    .object({ handle: z.string().trim(), followers: optionalCount, avg_views: optionalCount })
    .superRefine((row, ctx) => {
      if (!row.handle) return;
      if (!SocialUsername.safeParse(row.handle).success) {
        ctx.addIssue({ code: "custom", path: ["handle"], message: "validation.socialHandle" });
        return;
      }
      if (requireLookup && !row.followers)
        ctx.addIssue({ code: "custom", path: ["handle"], message: "validation.lookupRequired" });
    });

const socials = (requireLookup: boolean) =>
  z
    .object({
      instagram: socialRow(requireLookup),
      tiktok: socialRow(requireLookup),
      youtube: socialRow(requireLookup),
    })
    .refine((s) => NETWORKS.some((n) => s[n].handle), {
      message: "validation.socialsMin",
      path: ["instagram", "handle"],
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
  gender: z.union([Gender, z.literal("")]).refine((v) => v !== "", "validation.required"),
  birth_year: z
    .string()
    .trim()
    .refine((v) => v !== "", "validation.required")
    .refine((v) => v === "" || BirthYear.safeParse(v).success, "validation.birthYear"),
  bio: z.string().trim().max(600, "validation.tooLong"),
  categories: z.array(CreatorCategory).min(1, "validation.categoriesMin"),
  languages: z.array(ContentLanguage).min(1, "validation.languagesMin"),
  /** Paid / barter / collab (repost). At least one; stored as paid_open, barter_open, repost_open. */
  deal_formats: z.array(z.enum(DEAL_FORMATS)).min(1, "validation.dealFormatsMin"),
  lifestyle_tags: LifestyleTags,
  shoot_options: z.array(ShootOption),
  skills: z.array(CreatorSkill),
  socials: socials(true),
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

/** Sign-up wizard: same fields, but the social accounts are just usernames (no "connect"). */
export const CreatorSetupForm = CreatorForm.extend({ socials: socials(false) });

/** Which fields each wizard step owns (validated with form.trigger before moving on). */
export const STEP_FIELDS = {
  about: ["avatar_url", "display_name", "handle", "birth_year", "gender", "city", "bio"],
  content: ["categories", "languages", "deal_formats"],
  socials: ["socials", "contact_instagram", "contact_phone"],
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
    gender: "",
    birth_year: "",
    bio: "",
    categories: [],
    languages: ["az"],
    deal_formats: [],
    lifestyle_tags: [],
    shoot_options: [],
    skills: [],
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
    // Only numbers checked through the API count as "connected"; old self-reported numbers
    // don't, so the creator is asked to connect the account on the next save.
    const checked = socialNumbers(c, s);
    base.socials[s.network] = {
      handle: s.handle,
      followers: checked.checked && checked.followers != null ? String(checked.followers) : "",
      avg_views: checked.checked && checked.avg_views != null ? String(checked.avg_views) : "",
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
    gender: Gender.safeParse(c.gender).success ? (c.gender as CreatorFormValues["gender"]) : "",
    birth_year: c.birth_year ? String(c.birth_year) : "",
    bio: c.bio ?? "",
    categories: c.categories.filter(
      (x) => CreatorCategory.safeParse(x).success,
    ) as CreatorFormValues["categories"],
    languages: c.languages.filter(
      (x) => ContentLanguage.safeParse(x).success,
    ) as CreatorFormValues["languages"],
    deal_formats: DEAL_FORMATS.filter((f) => dealOpen(c, f)),
    lifestyle_tags: c.lifestyle_tags.filter(
      (x) => LifestyleTag.safeParse(x).success,
    ) as CreatorFormValues["lifestyle_tags"],
    shoot_options: c.shoot_options.filter(
      (x) => ShootOption.safeParse(x).success,
    ) as CreatorFormValues["shoot_options"],
    skills: c.skills.filter((x) => CreatorSkill.safeParse(x).success) as CreatorFormValues["skills"],
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
    gender: v.gender as z.infer<typeof Gender>,
    birth_year: Number(v.birth_year),
    bio: v.bio || null,
    categories: v.categories,
    languages: v.languages,
    paid_open: v.deal_formats.includes("paid"),
    barter_open: v.deal_formats.includes("barter"),
    repost_open: v.deal_formats.includes("collab"),
    lifestyle_tags: v.lifestyle_tags,
    shoot_options: v.shoot_options,
    skills: v.skills,
    socials: NETWORKS.filter((n) => v.socials[n].handle).map((n) => ({
      network: n,
      handle: SocialUsername.parse(v.socials[n].handle),
      ...(v.socials[n].followers ? { followers: toInt(v.socials[n].followers) } : {}),
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

/** "Özünüz haqqında" fields in display order, and whether each is filled. */
export const ABOUT_FIELDS = ["avatar_url", "display_name", "handle", "birth_year", "gender", "city", "bio"] as const;
export function aboutStatus(c: MyCreator) {
  return ABOUT_FIELDS.map((f) => ({ field: f, done: !!c[f] }));
}

/** The six parts of a creator profile: 3 from onboarding, 3 from the enhancer. */
export const PROFILE_SECTIONS = ["about", "content", "socials", "lifestyle", "portfolio", "terms"] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];
/** Sections that open in their own sheet from the completeness card (the rest go to the edit page). */
export const ENHANCER_SECTIONS = [
  "lifestyle",
  "portfolio",
  "terms",
] as const satisfies readonly ProfileSection[];

const share = (done: boolean[]) => Math.round((done.filter(Boolean).length / done.length) * 100);

/**
 * Completeness per section and in total (the average, each section counting the same).
 * Spec: "Creator Onboarding & Profile Completeness", Part 2.
 */
export function profileCompleteness(c: MyCreator) {
  const sections: Record<ProfileSection, number> = {
    about: share(aboutStatus(c).map((x) => x.done)),
    content: share([
      c.categories.length > 0,
      c.languages.length > 0,
      c.paid_open || c.barter_open || c.repost_open,
    ]),
    socials: share([c.creator_socials.length > 0, !!c.contact_phone]),
    lifestyle: c.lifestyle_tags.length > 0 ? 100 : 0,
    portfolio: Math.round((Math.min(c.portfolio_items.length, 3) / 3) * 100),
    terms: (c.creator_prices.length > 0 ? 50 : 0) + (c.shoot_options.length > 0 ? 50 : 0),
  };
  const values = Object.values(sections);
  return {
    sections,
    total: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    done: values.filter((v) => v === 100).length,
  };
}

import { z } from "zod";
import {
  blankToNull,
  CollaborationModel,
  CompensationType,
  ListingCompensationType,
  Currency,
  Pagination,
  PostFormat,
  SocialNetwork,
} from "./common";
import { City, CreatorCategory, EnabledNetwork } from "./taxonomy";

export const CampaignStatus = z.enum([
  "draft",
  "pending_review",
  "published",
  "paused",
  "closed",
  "rejected",
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

/** Empty → "required"; too short → "tooShort" (the form shows the first issue). */
const Text = (min: number, max: number) => {
  const filled = z.string().trim().min(1, "validation.required");
  return (min > 1 ? filled.min(min, "validation.tooShort") : filled).max(max, "validation.tooLong");
};
const OptionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max, "validation.tooLong").nullable());
const Int = (min: number, max: number) =>
  z.coerce
    .number({ error: "validation.number" })
    .int("validation.number")
    .min(min, "validation.number")
    .max(max, "validation.number");

/** Today as YYYY-MM-DD (UTC). Deadlines can't be in the past. */
const today = () => new Date().toISOString().slice(0, 10);

/** One content format the listing asks for, and how many of it (e.g. 3 × Reels). */
export const Deliverable = z.object({ format: PostFormat, count: Int(1, 20) });
export type Deliverable = z.infer<typeof Deliverable>;

const Deliverables = z
  .array(Deliverable)
  .max(7)
  .refine((d) => new Set(d.map((x) => x.format)).size === d.length, "validation.duplicate");

/** Every listing field with its type and limits. Empty optional inputs become null. */
const CampaignFields = z.object({
  title: Text(3, 120),
  description: Text(10, 4000),
  /** Content topic, same list as creator categories (so listings and creators match). */
  category: CreatorCategory,
  collaboration_model: CollaborationModel.default("post"),
  network: EnabledNetwork,
  /** One or more formats, each with its count: 3 × Reels and 1 × Stories. */
  deliverables: Deliverables.min(1, "validation.formatsMin"),
  compensation_type: ListingCompensationType,
  compensation_value: z.preprocess(
    blankToNull,
    z.coerce
      .number({ error: "validation.number" })
      .min(0, "validation.number")
      .max(1_000_000, "validation.number")
      .nullable(),
  ),
  compensation_details: OptionalText(300),
  currency: Currency.default("AZN"),
  creators_needed: Int(1, 100).default(1),
  min_followers: Int(0, 500_000_000).default(0),
  /** null = anywhere. */
  city: z.preprocess(blankToNull, City.nullable()),
  deadline: z.iso.date({ error: "validation.required" }),
  /** Required to publish (founders, 2026-11-19). */
  requirements: Text(1, 2000),
  usage_rights: OptionalText(500),
});

/**
 * A complete listing, required to publish (and to save one that isn't a draft). Required fields
 * follow wiki/concepts/campaign-board; the rest is optional.
 */
export const CampaignInput = CampaignFields.refine(
  (c) => c.compensation_type !== "money" || (c.compensation_value ?? 0) > 0,
  {
    path: ["compensation_value"],
    message: "validation.amount",
    when: (p) =>
      !p.issues.some((i) => ["compensation_type", "compensation_value"].includes(String(i.path?.[0]))),
  },
).refine((c) => c.deadline >= today(), {
  path: ["deadline"],
  message: "validation.deadlinePast",
  when: (p) => !p.issues.some((i) => i.path?.[0] === "deadline"),
});
export type CampaignInput = z.infer<typeof CampaignInput>;
/** Form values before parsing (strings from inputs; "" for empty optional fields). */
export type CampaignFormValues = z.input<typeof CampaignInput>;

/**
 * A draft can be saved half-filled (founders, 2026-11-19): same types and limits, but nothing
 * is required and there are no cross-field rules. Publishing checks CampaignInput again.
 */
export const CampaignDraft = CampaignFields.extend({
  title: OptionalText(120),
  description: OptionalText(4000),
  category: z.preprocess(blankToNull, CreatorCategory.nullable()),
  deadline: z.preprocess(blankToNull, z.iso.date({ error: "validation.date" }).nullable()),
  deliverables: Deliverables,
  requirements: OptionalText(2000),
});
export type CampaignDraft = z.infer<typeof CampaignDraft>;

/** Create and edit accept a draft; the service holds non-drafts to CampaignInput. */
export const CampaignUpdate = CampaignDraft;

export const CampaignStatusChange = z.object({
  status: z.enum(["draft", "published", "paused", "closed"]),
});

/** Archive (true) or restore (false) an own listing. Only finished ones: drafts, rejected, closed. */
export const CampaignArchiveChange = z.object({
  archived: z.boolean(),
});

export const CampaignFilters = Pagination.extend({
  network: SocialNetwork.optional(),
  compensation_type: CompensationType.optional(),
  city: z.string().optional(),
  category: z.string().optional(),
});
export type CampaignFilters = z.infer<typeof CampaignFilters>;

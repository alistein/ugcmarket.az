import type { CampaignDraft, CampaignFormValues } from "@/schemas";
import type { OwnCampaign } from "./hooks";

/** Create-listing wizard: what (the brief) → who (the creators) → pay and deadline (the offer). */
export const STEPS = ["what", "who", "pay"] as const;
export type Step = (typeof STEPS)[number];

/** Fields validated before leaving each step. */
export const STEP_FIELDS = {
  what: ["title", "category", "description", "network", "deliverables", "requirements"],
  who: ["creators_needed", "min_followers", "city"],
  pay: ["compensation_type", "compensation_value", "compensation_details", "deadline"],
} as const satisfies Record<Step, readonly (keyof CampaignFormValues)[]>;

/** Minimum follower presets offered as chips (0 = anyone). */
export const MIN_FOLLOWER_OPTIONS = [0, 1_000, 5_000, 10_000, 50_000, 100_000] as const;

/** Payment types a brand picks from: paid, barter, bid (offer-based). */
export { LISTING_COMPENSATION_TYPES as COMPENSATION_TYPES } from "@/schemas";

export function emptyCampaignForm(): CampaignFormValues {
  return {
    title: "",
    description: "",
    category: undefined as unknown as CampaignFormValues["category"],
    collaboration_model: "post",
    network: "instagram",
    deliverables: [{ format: "reels", count: 1 }],
    compensation_type: "money",
    compensation_value: "",
    compensation_details: "",
    currency: "AZN",
    creators_needed: 1,
    min_followers: 0,
    city: "",
    deadline: "",
    requirements: "",
    usage_rights: "",
  };
}

/** YYYY-MM-DD for today in the user's time zone (min for the deadline picker). */
export function localToday() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Form values → API payload: content is always posted on the creator's account (UGC video
 * for the brand only was removed, 2026-11-25); drop what doesn't apply to the payment type (amount only when paid).
 */
export function toPayload<T extends CampaignDraft>(v: T): T {
  return {
    ...v,
    collaboration_model: "post",
    compensation_value: v.compensation_type === "money" ? v.compensation_value : null,
  };
}

/** Saved listing → form values (null → "" for text inputs). */
export function campaignToForm(c: OwnCampaign): CampaignFormValues {
  return {
    title: c.title ?? "",
    description: c.description ?? "",
    category: (c.category ?? undefined) as CampaignFormValues["category"],
    collaboration_model: "post",
    network: c.network as CampaignFormValues["network"],
    deliverables: c.deliverables,
    compensation_type: c.compensation_type as CampaignFormValues["compensation_type"],
    compensation_value: c.compensation_value ?? "",
    compensation_details: c.compensation_details ?? "",
    currency: c.currency as CampaignFormValues["currency"],
    creators_needed: c.creators_needed,
    min_followers: c.min_followers,
    city: c.city ?? "",
    deadline: c.deadline ?? "",
    requirements: c.requirements ?? "",
    usage_rights: c.usage_rights ?? "",
  };
}

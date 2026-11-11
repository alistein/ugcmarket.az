import { z } from "zod";
import { CollaborationModel, CompensationType, Currency, Pagination, PostFormat, SocialNetwork } from "./common";

export const CampaignStatus = z.enum(["draft", "pending_review", "published", "paused", "closed", "rejected"]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

/** MVP form — required fields per wiki/concepts/campaign-board. Rest optional. */
export const CampaignInput = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  promoted_item: z.string().max(200).optional(),
  category: z.string().min(1).max(60),
  collaboration_model: CollaborationModel.default("post"),
  network: SocialNetwork,
  format: PostFormat,
  posts_count: z.coerce.number().int().min(1).max(20).default(1),
  compensation_type: CompensationType,
  compensation_value: z.coerce.number().min(0).optional(),
  compensation_details: z.string().max(300).optional(),
  currency: Currency.default("AZN"),
  creators_needed: z.coerce.number().int().min(1).max(100).default(1),
  min_followers: z.coerce.number().int().min(0).default(0),
  city: z.string().max(60).optional(),
  deadline: z.iso.date(),
  requirements: z.string().max(2000).optional(),
  usage_rights: z.string().max(500).optional(),
});
export type CampaignInput = z.infer<typeof CampaignInput>;

export const CampaignUpdate = CampaignInput.partial();

export const CampaignStatusChange = z.object({
  status: z.enum(["draft", "published", "paused", "closed"]),
});

export const CampaignFilters = Pagination.extend({
  network: SocialNetwork.optional(),
  compensation_type: CompensationType.optional(),
  city: z.string().optional(),
  category: z.string().optional(),
});
export type CampaignFilters = z.infer<typeof CampaignFilters>;

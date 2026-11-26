import { describe, expect, it } from "vitest";
import { CampaignInput } from "@/schemas";
import { campaignToForm, toPayload } from "./form";
import type { OwnCampaign } from "./hooks";

const saved: OwnCampaign = {
  id: "c1",
  slug: null,
  brand_id: "b1",
  title: "Reels for our menu",
  description: "Film our new breakfast in the morning light.",
  category: "food",
  collaboration_model: "post",
  network: "instagram",
  deliverables: [
    { format: "reels", count: 3 },
    { format: "stories", count: 1 },
  ],
  compensation_type: "barter",
  compensation_value: null,
  compensation_details: "Breakfast for two",
  gift_type: "none",
  currency: "AZN",
  creators_needed: 1,
  min_followers: 10_000,
  city: null,
  deadline: "2099-12-15",
  requirements: "Tag the brand.",
  usage_rights: null,
  status: "pending_review",
  created_at: "2026-11-19T00:00:00Z",
  published_at: null,
  archived_at: null,
};

describe("campaign form helpers", () => {
  it("bid listings drop the amount and keep the gift's details", () => {
    const p = toPayload(
      CampaignInput.parse({
        ...campaignToForm(saved),
        compensation_type: "bid",
        compensation_value: "500",
        gift_type: "product",
      }),
    );
    expect(p.compensation_value).toBeNull();
    expect(p.gift_type).toBe("product");
    expect(p.compensation_details).toBe("Breakfast for two");
  });

  it("drops details on paid or bid listings without a gift (D7)", () => {
    for (const compensation_type of ["money", "bid"] as const) {
      const p = toPayload(
        CampaignInput.parse({ ...campaignToForm(saved), compensation_type, compensation_value: "200" }),
      );
      expect(p.gift_type).toBe("none");
      expect(p.compensation_details).toBeNull();
    }
  });

  it("old listings without a gift load as none", () => {
    expect(campaignToForm(saved).gift_type).toBe("none");
  });

  it("round-trips a saved listing through the form unchanged", () => {
    const parsed = CampaignInput.parse(campaignToForm(saved));
    const { id, slug, brand_id, status, created_at, published_at, archived_at, ...content } = saved;
    void id;
    void slug;
    void brand_id;
    void status;
    void created_at;
    void published_at;
    void archived_at;
    expect(toPayload(parsed)).toEqual(content);
  });

  it("keeps a paid listing's extra; content is always posted on the creator's account", () => {
    const parsed = CampaignInput.parse({
      ...campaignToForm(saved),
      compensation_type: "money",
      compensation_value: "200",
      gift_type: "service",
      deliverables: [{ format: "reels", count: 2 }],
    });
    const p = toPayload(parsed);
    expect(p.compensation_details).toBe("Breakfast for two"); // paid + a service on top
    expect(p.compensation_value).toBe(200);
    expect(p.collaboration_model).toBe("post");
  });

  it("rejects the removed UGC video format", () => {
    expect(
      CampaignInput.safeParse({ ...campaignToForm(saved), deliverables: [{ format: "ugc_video", count: 1 }] })
        .success,
    ).toBe(false);
  });
});

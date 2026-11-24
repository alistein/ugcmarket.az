import { describe, expect, it } from "vitest";
import { CampaignInput } from "@/schemas";
import { campaignToForm, toPayload } from "./form";
import type { OwnCampaign } from "./hooks";

const saved: OwnCampaign = {
  id: "c1",
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
  it("bid listings keep the budget ceiling and the extra", () => {
    const p = toPayload(
      CampaignInput.parse({ ...campaignToForm(saved), compensation_type: "bid", compensation_value: "500" }),
    );
    expect(p.compensation_value).toBe(500);
    expect(p.compensation_details).toBe("Breakfast for two");
  });

  it("unpaid listings offer nothing extra", () => {
    const p = toPayload(CampaignInput.parse({ ...campaignToForm(saved), compensation_type: "unpaid" }));
    expect(p.compensation_details).toBeNull();
    expect(p.compensation_value).toBeNull();
  });

  it("round-trips a saved listing through the form unchanged", () => {
    const parsed = CampaignInput.parse(campaignToForm(saved));
    const { id, brand_id, status, created_at, published_at, archived_at, ...content } = saved;
    void id;
    void brand_id;
    void status;
    void created_at;
    void published_at;
    void archived_at;
    expect(toPayload(parsed)).toEqual(content);
  });

  it("keeps a paid listing's extra; UGC model only when every format is UGC video", () => {
    const parsed = CampaignInput.parse({
      ...campaignToForm(saved),
      compensation_type: "money",
      compensation_value: "200",
      deliverables: [{ format: "ugc_video", count: 2 }],
    });
    const p = toPayload(parsed);
    expect(p.compensation_details).toBe("Breakfast for two"); // paid + a product on top
    expect(p.compensation_value).toBe(200);
    expect(p.collaboration_model).toBe("ugc");
    const mixed = toPayload(
      CampaignInput.parse({
        ...campaignToForm(saved),
        deliverables: [
          { format: "ugc_video", count: 1 },
          { format: "reels", count: 1 },
        ],
      }),
    );
    expect(mixed.collaboration_model).toBe("post");
  });
});

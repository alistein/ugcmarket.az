import { describe, expect, it } from "vitest";
import { ApplicationInput } from "./application";
import { CampaignDraft, CampaignInput } from "./campaign";

const future = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

const base = {
  title: "Reels for our menu",
  description: "Film our new breakfast in the morning light.",
  category: "food",
  network: "instagram",
  deliverables: [{ format: "reels", count: 1 }],
  posts_count: 1,
  compensation_type: "money",
  compensation_value: "150",
  compensation_details: "",
  creators_needed: 1,
  min_followers: 0,
  city: "",
  deadline: future,
  requirements: "Tag the brand.",
  usage_rights: "",
};

const paths = (input: unknown) =>
  CampaignInput.safeParse(input).error?.issues.map((i) => String(i.path[0])) ?? [];

describe("CampaignInput", () => {
  it("parses form strings: amount to a number, empty optionals to null", () => {
    const r = CampaignInput.parse(base);
    expect(r.compensation_value).toBe(150);
    expect(r.city).toBeNull();
    expect(r.currency).toBe("AZN");
  });

  it("needs an amount for paid listings", () => {
    expect(paths({ ...base, compensation_value: "" })).toEqual(["compensation_value"]);
  });

  it("doesn't need an amount for barter", () => {
    expect(paths({ ...base, compensation_type: "barter", compensation_value: "" })).toEqual([]);
  });

  it("doesn't need an amount for bid", () => {
    expect(paths({ ...base, compensation_type: "bid", compensation_value: "" })).toEqual([]);
  });

  it("rejects a past deadline", () => {
    expect(paths({ ...base, deadline: "2020-01-01" })).toEqual(["deadline"]);
  });

  it("needs at least one format, no duplicates, counts 1 to 20", () => {
    expect(paths({ ...base, deliverables: [] })).toEqual(["deliverables"]);
    const reels = { format: "reels", count: 1 };
    expect(paths({ ...base, deliverables: [reels, reels] })).toEqual(["deliverables"]);
    expect(paths({ ...base, deliverables: [{ format: "reels", count: 0 }] })).toEqual(["deliverables"]);
    const two = [
      { format: "reels", count: "3" },
      { format: "stories", count: 1 },
    ];
    expect(CampaignInput.parse({ ...base, deliverables: two }).deliverables).toEqual([
      { format: "reels", count: 3 },
      { format: "stories", count: 1 },
    ]);
  });

  it("offers paid, bid and barter only", () => {
    expect(paths({ ...base, compensation_type: "product" })).toEqual(["compensation_type"]);
    expect(paths({ ...base, compensation_type: "unpaid" })).toEqual(["compensation_type"]);
  });

  it("requires requirements to publish", () => {
    expect(paths({ ...base, requirements: " " })).toEqual(["requirements"]);
  });

  it("only accepts enabled networks", () => {
    expect(paths({ ...base, network: "tiktok" })).toEqual(["network"]);
  });

  it("reports the amount together with other errors", () => {
    const p = paths({ ...base, title: "", compensation_value: "" });
    expect(p).toContain("title");
    expect(p).toContain("compensation_value");
  });

  it("says 'required' for an empty title and 'too short' for a short one", () => {
    const msg = (title: string) => CampaignInput.safeParse({ ...base, title }).error?.issues[0].message;
    expect(msg("")).toBe("validation.required");
    expect(msg("ab")).toBe("validation.tooShort");
  });
});

describe("CampaignDraft", () => {
  it("saves a half-filled listing: empty required fields become null", () => {
    const r = CampaignDraft.parse({
      ...base,
      title: "",
      description: "",
      category: "",
      deadline: "",
      compensation_value: "",
    });
    expect(r).toMatchObject({
      title: null,
      description: null,
      category: null,
      deadline: null,
      compensation_value: null,
    });
  });

  it("accepts an untouched select (undefined) as empty", () => {
    expect(CampaignDraft.parse({ ...base, category: undefined }).category).toBeNull();
  });

  it("still checks types and limits", () => {
    expect(CampaignDraft.safeParse({ ...base, title: "x".repeat(121) }).success).toBe(false);
    expect(CampaignDraft.safeParse({ ...base, compensation_value: "abc" }).success).toBe(false);
  });

  it("allows no format yet", () => {
    expect(CampaignDraft.parse({ ...base, deliverables: [] }).deliverables).toEqual([]);
  });

  it("allows a past deadline and a paid listing without an amount (checked on publish)", () => {
    expect(CampaignDraft.safeParse({ ...base, deadline: "2020-01-01", compensation_value: "" }).success).toBe(
      true,
    );
  });

  it("a saved draft row fails the publish check until it is complete", () => {
    const row = CampaignDraft.parse({ ...base, description: "" });
    expect(CampaignInput.safeParse(row).success).toBe(false);
    expect(CampaignInput.safeParse({ ...row, description: base.description }).success).toBe(true);
  });
});

describe("ApplicationInput", () => {
  it("parses a bid from a form string; empty means no bid", () => {
    expect(ApplicationInput.parse({ bid_amount: "250" }).bid_amount).toBe(250);
    expect(ApplicationInput.parse({ bid_amount: "" }).bid_amount).toBeNull();
    expect(ApplicationInput.parse({}).bid_amount).toBeUndefined();
  });

  it("rejects a zero, negative or huge bid", () => {
    for (const bid_amount of [0, -5, 2_000_000])
      expect(ApplicationInput.safeParse({ bid_amount }).success).toBe(false);
  });
});

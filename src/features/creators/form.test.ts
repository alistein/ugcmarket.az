import { describe, expect, it } from "vitest";
import {
  CreatorForm,
  CreatorSetupForm,
  emptyCreatorForm,
  profileCompleteness,
  STEPS,
  toPayload,
} from "./form";
import { LifestyleTags } from "@/schemas";
import { type MyCreator, portfolioSummary } from "./hooks";
import { ageFrom } from "./who";

const filled = () => {
  const v = emptyCreatorForm();
  v.display_name = "Nigar";
  v.handle = "nigar";
  v.city = "baku";
  v.gender = "female";
  v.birth_year = "1995";
  v.categories = ["beauty"];
  v.languages = ["az"];
  v.deal_formats = ["paid"];
  v.socials.instagram.handle = "nigar.creates";
  return v;
};

describe("creator social accounts", () => {
  it("sign-up takes a username without connecting it", () => {
    const r = CreatorSetupForm.safeParse(filled());
    expect(r.success).toBe(true);
    const payload = toPayload(filled());
    expect(payload.socials).toEqual([{ network: "instagram", handle: "nigar.creates" }]);
  });

  it("editing still needs the account connected", () => {
    const r = CreatorForm.safeParse(filled());
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("validation.lookupRequired");
  });

  it("sign-up still checks the username", () => {
    const v = filled();
    v.socials.instagram.handle = "bad handle!";
    expect(CreatorSetupForm.safeParse(v).error?.issues[0]?.message).toBe("validation.socialHandle");
  });
});

describe("gender and birth year", () => {
  const year = new Date().getFullYear();

  it("are required", () => {
    const v = filled();
    v.gender = "";
    v.birth_year = "";
    const keys = CreatorSetupForm.safeParse(v).error?.issues.map((i) => i.path.join("."));
    expect(keys).toEqual(expect.arrayContaining(["gender", "birth_year"]));
  });

  it("accepts 16 to 80 years old only", () => {
    const at = (age: number) => {
      const v = filled();
      v.birth_year = String(year - age);
      return CreatorSetupForm.safeParse(v).success;
    };
    expect([at(15), at(16), at(80), at(81)]).toEqual([false, true, true, false]);
  });

  it("go to the API as a gender and a number", () => {
    const p = toPayload(filled());
    expect([p.gender, p.birth_year]).toEqual(["female", 1995]);
  });

  it("brands see the age, worked out from the year", () => {
    const now = new Date(2026, 5, 1);
    expect(ageFrom(1996, now)).toBe(30);
    expect(ageFrom(2010, now)).toBe(16);
  });
});

describe("onboarding step order", () => {
  it("asks for socials before content, so the Instagram lookup runs during the last step", () => {
    expect(STEPS).toEqual(["about", "socials", "content"]);
  });
});

describe("onboarding content step", () => {
  it("needs at least one deal format", () => {
    const v = filled();
    v.deal_formats = [];
    const keys = CreatorSetupForm.safeParse(v).error?.issues.map((i) => i.path.join("."));
    expect(keys).toContain("deal_formats");
  });

  it("has no category limit", () => {
    const v = filled();
    v.categories = ["beauty", "fashion", "food", "travel", "home", "family", "books", "apps"];
    expect(CreatorSetupForm.safeParse(v).success).toBe(true);
  });

  it("maps deal formats to the three flags (collab is the repost deal)", () => {
    const v = filled();
    v.deal_formats = ["barter", "collab"];
    const p = toPayload(v);
    expect([p.paid_open, p.barter_open, p.repost_open]).toEqual([false, true, true]);
  });
});

describe("lifestyle tags", () => {
  it("Subay and Ailəvi can't both be picked, Uşaqlı goes with either", () => {
    expect(LifestyleTags.safeParse(["single", "married"]).success).toBe(false);
    expect(LifestyleTags.safeParse(["married", "has_kids"]).success).toBe(true);
  });
});

describe("profile completeness", () => {
  const base = {
    avatar_url: null,
    display_name: "Nigar",
    handle: "nigar",
    birth_year: 1995,
    gender: "female",
    city: "baku",
    bio: null,
    categories: ["beauty"],
    languages: ["az"],
    paid_open: true,
    barter_open: false,
    repost_open: false,
    creator_socials: [
      { network: "instagram", handle: "nigar", followers: 0, avg_views: null, verified: false },
    ],
    contact_phone: "+994501234567",
    lifestyle_tags: [],
    portfolio_items: [],
    creator_prices: [],
    shoot_options: [],
  } as unknown as MyCreator;

  it("right after onboarding, without photo and bio, is 45%", () => {
    const r = profileCompleteness(base);
    expect(r.sections).toEqual({
      about: 71,
      content: 100,
      socials: 100,
      lifestyle: 0,
      portfolio: 0,
      terms: 0,
    });
    expect(r.total).toBe(45);
    expect(r.done).toBe(2);
  });

  it("enhancer sections fill as specced", () => {
    const r = profileCompleteness({
      ...base,
      lifestyle_tags: ["cat_owner"],
      portfolio_items: [{}, {}] as MyCreator["portfolio_items"],
      creator_prices: [{ format: "reels", amount: 80, currency: "AZN" }] as MyCreator["creator_prices"],
    });
    expect([r.sections.lifestyle, r.sections.portfolio, r.sections.terms]).toEqual([100, 67, 50]);
  });
});

describe("portfolio summary", () => {
  const item = (owner: string, views: number | null, likes: number, comments: number) => ({
    id: Math.random().toString(),
    url: "https://www.instagram.com/reel/x/",
    network: "instagram" as const,
    title: null,
    position: 0,
    portfolio_item_stats: {
      owner_handle: owner,
      views,
      likes,
      comments,
      posted_at: null,
      fetched_at: "2026-11-24",
    },
  });
  const creator = (items: ReturnType<typeof item>[]) => ({
    creator_socials: [
      { network: "instagram" as const, handle: "nigar", followers: 0, avg_views: null, verified: false },
    ],
    portfolio_items: items,
  });

  it("is empty without checked numbers", () => {
    expect(portfolioSummary(creator([]))).toBeNull();
    expect(portfolioSummary(creator([item("nigar", null, 0, 0)]))).toBeNull();
  });

  it("uses median views, so one viral Reel doesn't inflate it", () => {
    const s = portfolioSummary(
      creator([item("nigar", 1000, 50, 0), item("nigar", 2000, 100, 0), item("nigar", 1_000_000, 10_000, 0)]),
    )!;
    expect(s).toMatchObject({ count: 3, medianViews: 2000, totalViews: 1_003_000, bestViews: 1_000_000 });
    expect(s.er).toBeCloseTo((5 + 5 + 1) / 3);
  });

  it("leaves out posts from other accounts", () => {
    const s = portfolioSummary(creator([item("nigar", 1000, 10, 0), item("someone", 9_000_000, 0, 0)]))!;
    expect(s).toMatchObject({ count: 1, totalViews: 1000 });
  });
});

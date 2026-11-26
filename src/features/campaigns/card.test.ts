import { describe, expect, it } from "vitest";
import { CampaignFilters } from "@/schemas";
import { daysLeft } from "./components/listing-card";

describe("daysLeft", () => {
  const now = new Date(2026, 10, 24, 23, 30); // late evening, local time
  it("counts whole calendar days, 0 on the last day", () => {
    expect(daysLeft("2026-11-24", now)).toBe(0);
    expect(daysLeft("2026-11-25", now)).toBe(1);
    expect(daysLeft("2026-12-01", now)).toBe(7);
  });
  it("is negative once the deadline has passed", () => {
    expect(daysLeft("2026-11-23", now)).toBe(-1);
  });
});

describe("CampaignFilters", () => {
  it("accepts only known cities and categories (they go into the query string)", () => {
    expect(CampaignFilters.safeParse({ city: "baku" }).success).toBe(true);
    expect(CampaignFilters.safeParse({ city: "baku,city.is.null" }).success).toBe(false);
    expect(CampaignFilters.safeParse({ category: "food" }).success).toBe(true);
    expect(CampaignFilters.safeParse({ category: "x" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { CampaignFilters } from "@/schemas";
import { daysLeft, isNew } from "./components/listing-card";

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

describe("isNew", () => {
  const now = Date.parse("2026-11-24T12:00:00Z");
  it("is true for 48 hours after publishing", () => {
    expect(isNew("2026-11-23T12:00:00Z", now)).toBe(true);
    expect(isNew("2026-11-22T11:59:00Z", now)).toBe(false);
    expect(isNew(null, now)).toBe(false);
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

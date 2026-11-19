import { describe, expect, it } from "vitest";
import { BrandProfileInput } from "./brand";

const base = {
  name: "Nur Kafe",
  logo_url: null,
  category: "food",
  website: "",
  contact_instagram: "@nurkafe",
  contact_phone: "+994 50 123 45 67",
  contact_email: "info@nurkafe.az",
};

const issue = (input: object) => BrandProfileInput.safeParse(input).error?.issues[0];

describe("BrandProfileInput", () => {
  it("cleans the inputs: Instagram handle, email case, empty website", () => {
    const r = BrandProfileInput.parse({ ...base, contact_email: " Info@NurKafe.az " });
    expect(r.contact_instagram).toBe("nurkafe");
    expect(r.contact_email).toBe("info@nurkafe.az");
    expect(r.website).toBeNull();
  });

  it("adds https:// to a bare website", () => {
    expect(BrandProfileInput.parse({ ...base, website: "nurkafe.az" }).website).toBe("https://nurkafe.az");
  });

  it("rejects a website that isn't a domain", () => {
    expect(BrandProfileInput.safeParse({ ...base, website: "nur kafe" }).success).toBe(false);
  });

  it.each(["contact_instagram", "contact_phone", "contact_email"])("requires %s", (field) => {
    expect(issue({ ...base, [field]: " " })).toMatchObject({ path: [field], message: "validation.required" });
    expect(issue({ ...base, [field]: undefined })).toMatchObject({
      path: [field],
      message: "validation.required",
    });
  });

  it("checks the format once filled in", () => {
    expect(issue({ ...base, contact_email: "info@" })).toMatchObject({ message: "validation.email" });
    expect(issue({ ...base, contact_phone: "abc" })).toMatchObject({ message: "validation.phone" });
  });

  it("reports every empty contact at once", () => {
    const r = BrandProfileInput.safeParse({
      ...base,
      name: "",
      contact_instagram: "",
      contact_phone: "",
      contact_email: "",
    });
    expect(r.error?.issues.map((i) => i.path[0])).toEqual([
      "name",
      "contact_instagram",
      "contact_phone",
      "contact_email",
    ]);
  });

  it("requires a known category", () => {
    expect(BrandProfileInput.safeParse({ ...base, category: "" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { CreatorForm, CreatorSetupForm, emptyCreatorForm, toPayload } from "./form";
import { ageRange } from "./hooks";

const filled = () => {
  const v = emptyCreatorForm();
  v.display_name = "Nigar";
  v.handle = "nigar";
  v.city = "baku";
  v.gender = "female";
  v.birth_year = "1995";
  v.categories = ["beauty"];
  v.languages = ["az"];
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

  it("brands see an age range", () => {
    const now = new Date(2026, 5, 1);
    expect(ageRange(null, now)).toBeNull();
    expect(ageRange(2010, now)).toBe("under_18");
    expect(ageRange(2008, now)).toBe("18_24");
    expect(ageRange(1995, now)).toBe("25_34");
    expect(ageRange(1990, now)).toBe("35_44");
    expect(ageRange(1970, now)).toBe("45_plus");
  });
});

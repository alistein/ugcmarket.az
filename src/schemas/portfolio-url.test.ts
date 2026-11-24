import { describe, expect, it } from "vitest";
import az from "../../messages/az.json";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import { checkPortfolioUrl, PORTFOLIO_URL_ISSUES, PortfolioItemInput } from "./creator";

const ok = (raw: string, url: string) =>
  expect(checkPortfolioUrl(raw)).toMatchObject({ ok: true, network: "instagram", url });
const issue = (raw: string, key: string) => expect(checkPortfolioUrl(raw)).toEqual({ ok: false, issue: key });

describe("portfolio link: accepted, and stored in one form", () => {
  it.each([
    ["https://www.instagram.com/reel/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    ["https://instagram.com/reel/DgBQriHgRoa", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    // Copied from the app: tracking parameter.
    [
      "https://www.instagram.com/reel/DgBQriHgRoa/?igsh=MWQ1ZGUxMzBkMA==",
      "https://www.instagram.com/reel/DgBQriHgRoa/",
    ],
    // Account name in the path (from a profile grid).
    ["https://www.instagram.com/natgeo/reel/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    // Reels tab URL form.
    ["https://www.instagram.com/reels/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    // No scheme, spaces around, http, capital letters in the host.
    ["  instagram.com/reel/DgBQriHgRoa  ", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    ["www.instagram.com/reel/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    ["http://Instagram.com/reel/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
    // /p/ links can be videos too: the server checks the type.
    ["https://www.instagram.com/p/DgIeBSXoR72/", "https://www.instagram.com/p/DgIeBSXoR72/"],
    ["https://www.instagram.com/tv/DgBQriHgRoa/", "https://www.instagram.com/reel/DgBQriHgRoa/"],
  ])("%s", (raw, url) => ok(raw, url));
});

describe("portfolio link: mistakes the creator can fix", () => {
  it.each([
    ["", "validation.portfolioEmpty"],
    ["   ", "validation.portfolioEmpty"],
    ["salam", "validation.portfolioNotLink"],
    ["reel DgBQriHgRoa", "validation.portfolioNotLink"],
    ["@natgeo", "validation.portfolioNotLink"],
    ["ftp://instagram.com/reel/x", "validation.portfolioNotLink"],
    // Other sites.
    ["https://facebook.com/watch/?v=1", "validation.portfolioUnsupported"],
    ["https://drive.google.com/file/d/abc/view", "validation.portfolioUnsupported"],
    ["https://instagram.com.evil.com/reel/DgBQriHgRoa/", "validation.portfolioUnsupported"],
    // Networks that come later.
    ["https://www.tiktok.com/@user/video/7312345678901234567", "validation.portfolioNetworkSoon"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "validation.portfolioNetworkSoon"],
    // Instagram, but not one post.
    ["https://www.instagram.com/natgeo/", "validation.portfolioProfile"],
    ["https://www.instagram.com/natgeo/reels/", "validation.portfolioProfile"],
    ["instagram.com/nigar.creates", "validation.portfolioProfile"],
    ["https://www.instagram.com/stories/natgeo/3456789012345678901/", "validation.portfolioStory"],
    ["https://www.instagram.com/stories/highlights/17912345678901234/", "validation.portfolioStory"],
    ["https://www.instagram.com/", "validation.portfolioNotPost"],
    ["https://www.instagram.com/explore/", "validation.portfolioNotPost"],
    ["https://www.instagram.com/reels/", "validation.portfolioNotPost"],
    ["https://www.instagram.com/reel/", "validation.portfolioNotPost"],
    ["https://www.instagram.com/direct/inbox/", "validation.portfolioNotPost"],
  ])("%s", (raw, key) => issue(raw, key));
});

describe("portfolio link: the account in the path", () => {
  it("is read when the link names it, so someone else's post is refused without a lookup", () => {
    expect(checkPortfolioUrl("https://www.instagram.com/NatGeo/reel/DgBQriHgRoa/")).toMatchObject({
      account: "natgeo",
    });
  });
  it("is unknown for links copied from the app", () => {
    expect(checkPortfolioUrl("https://www.instagram.com/reel/DgBQriHgRoa/?igsh=x")).toMatchObject({
      account: null,
    });
  });
});

describe("portfolio API input", () => {
  it("sends the cleaned link and the network", () => {
    const r = PortfolioItemInput.safeParse({ url: "instagram.com/natgeo/reel/DgBQriHgRoa?igsh=x" });
    expect(r.success && r.data).toMatchObject({
      url: "https://www.instagram.com/reel/DgBQriHgRoa/",
      network: "instagram",
    });
  });

  it("reports the fix as the field error", () => {
    const r = PortfolioItemInput.safeParse({ url: "https://www.instagram.com/natgeo/" });
    expect(r.error?.issues[0]).toMatchObject({ path: ["url"], message: "validation.portfolioProfile" });
  });
});

describe("every portfolio error has copy in az, ru and en", () => {
  const keys = [
    ...PORTFOLIO_URL_ISSUES,
    "errors.portfolio_not_found",
    "errors.portfolio_private",
    "errors.portfolio_not_video",
    "errors.portfolio_duplicate",
    "errors.portfolio_not_yours",
  ];
  const get = (msgs: Record<string, unknown>, key: string) =>
    key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], msgs);
  it.each([
    ["az", az],
    ["ru", ru],
    ["en", en],
  ])("%s", (_, msgs) => {
    for (const key of keys) expect(typeof get(msgs, key), key).toBe("string");
  });
});

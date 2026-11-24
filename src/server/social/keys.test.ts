import { describe, expect, it } from "vitest";
import { postKey, profileKey } from "./keys";

describe("social cache keys", () => {
  it("one key for every form of the same Instagram post", () => {
    const k = "instagram:DgBQriHgRoa";
    expect(postKey("instagram", "https://www.instagram.com/reel/DgBQriHgRoa/")).toBe(k);
    expect(postKey("instagram", "https://instagram.com/p/DgBQriHgRoa")).toBe(k);
    expect(postKey("instagram", "https://www.instagram.com/natgeo/reel/DgBQriHgRoa/?igsh=abc")).toBe(k);
  });

  it("YouTube and TikTok ids, and a cleaned URL as the fallback", () => {
    expect(postKey("youtube", "https://youtu.be/dQw4w9WgXcQ")).toBe("youtube:dQw4w9WgXcQ");
    expect(postKey("youtube", "https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("youtube:dQw4w9WgXcQ");
    expect(postKey("tiktok", "https://www.tiktok.com/@a/video/7312345678901234567")).toBe(
      "tiktok:7312345678901234567",
    );
    expect(postKey("instagram", "https://example.com/Some/Path/?x=1")).toBe(
      "instagram:https://example.com/some/path",
    );
  });

  it("accounts are case-insensitive", () => {
    expect(profileKey("instagram", "NatGeo")).toBe("instagram:natgeo");
  });
});

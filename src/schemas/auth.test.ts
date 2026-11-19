import { describe, expect, it } from "vitest";
import { CodeInput, Email, NewPassword, SetPasswordInput } from "./auth";

describe("auth schemas", () => {
  it("normalizes email", () => {
    expect(Email.parse("  Ali@Mail.AZ ")).toBe("ali@mail.az");
    expect(Email.safeParse("not-an-email").success).toBe(false);
  });

  it("accepts a 6-digit code, with spaces from paste", () => {
    expect(CodeInput.parse({ code: "903951" }).code).toBe("903951");
    expect(CodeInput.parse({ code: "903 951" }).code).toBe("903951");
    expect(CodeInput.safeParse({ code: "90395" }).success).toBe(false);
    // Supabase must be set to 6-digit OTPs (Auth → Email → Email OTP Length).
    expect(CodeInput.safeParse({ code: "90395123" }).success).toBe(false);
  });

  it("mirrors Supabase password rules (8+, a letter and a digit)", () => {
    expect(NewPassword.safeParse("abcd1234").success).toBe(true);
    expect(NewPassword.safeParse("şifrə123").success).toBe(true);
    expect(NewPassword.safeParse("abc123").success).toBe(false);
    expect(NewPassword.safeParse("abcdefgh").success).toBe(false);
    expect(NewPassword.safeParse("12345678").success).toBe(false);
  });

  it("requires matching confirmation", () => {
    expect(SetPasswordInput.safeParse({ password: "abcd1234", confirm: "abcd1234" }).success).toBe(true);
    expect(SetPasswordInput.safeParse({ password: "abcd1234", confirm: "abcd12345" }).success).toBe(false);
  });
});

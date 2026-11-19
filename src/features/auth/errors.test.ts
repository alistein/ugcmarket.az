import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { AuthFlowError, errorKeyOf, isAuthErrorKey, toAuthFlowError } from "./errors";

const apiError = (code: string, status = 400) => new AuthApiError("raw server text", status, code);

describe("auth error mapping", () => {
  it.each([
    ["invalid_credentials", "invalid_credentials"],
    ["email_not_confirmed", "email_not_confirmed"],
    ["otp_expired", "code_invalid"],
    ["over_email_send_rate_limit", "too_many_emails"],
    ["weak_password", "weak_password"],
    ["user_banned", "blocked"],
    ["flow_state_expired", "link_expired"],
  ])("maps Supabase %s → %s", (code, key) => {
    expect(errorKeyOf(apiError(code))).toBe(key);
  });

  it("maps 429 without a known code to too_many_requests", () => {
    expect(errorKeyOf(apiError("something_new", 429))).toBe("too_many_requests");
  });

  it("maps fetch failures to network", () => {
    expect(errorKeyOf(new AuthRetryableFetchError("fetch failed", 0))).toBe("network");
    expect(errorKeyOf(new TypeError("Failed to fetch"))).toBe("network");
  });

  it("never leaks unknown server text", () => {
    expect(errorKeyOf(apiError("brand_new_code"))).toBe("unknown");
    expect(errorKeyOf(new Error("boom"))).toBe("unknown");
  });

  it("passes our own errors through", () => {
    const e = new AuthFlowError("email_off");
    expect(toAuthFlowError(e)).toBe(e);
    expect(isAuthErrorKey("link_invalid")).toBe(true);
    expect(isAuthErrorKey("<script>")).toBe(false);
  });
});

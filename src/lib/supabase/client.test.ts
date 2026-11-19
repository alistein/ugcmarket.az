import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorKeyOf } from "@/features/auth/errors";
import { fetchWithTimeout } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("fetchWithTimeout", () => {
  it("always attaches an abort signal", async () => {
    const fetch = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await fetchWithTimeout("https://x.supabase.co/auth/v1/otp", { method: "POST" });
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.method).toBe("POST");
  });

  it("still honours the caller's signal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_: unknown, init: RequestInit) =>
          new Promise((_, reject) =>
            init.signal!.addEventListener("abort", () => reject(init.signal!.reason)),
          ),
      ),
    );
    const caller = new AbortController();
    const pending = fetchWithTimeout("https://x.supabase.co", { signal: caller.signal });
    caller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
  });

  it("a timed-out auth call surfaces as the network error", () => {
    // supabase-js wraps any fetch rejection (incl. our timeout) in AuthRetryableFetchError.
    expect(errorKeyOf(new AuthRetryableFetchError("The operation was aborted due to timeout", 0))).toBe(
      "network",
    );
  });
});

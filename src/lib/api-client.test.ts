import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiClientError } from "./api-client";

const reply = (status: number, body?: unknown) =>
  vi.fn(async () =>
    body === undefined
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );

afterEach(() => vi.unstubAllGlobals());

describe("api()", () => {
  it("unwraps { data }", async () => {
    vi.stubGlobal("fetch", reply(200, { data: { id: 1 } }));
    await expect(api("/me")).resolves.toEqual({ id: 1 });
  });

  // Regression: onboarding's role POST returns 204 and used to throw on `null.data`.
  it("treats 204 No Content as success", async () => {
    vi.stubGlobal("fetch", reply(204));
    await expect(api("/me/role", { method: "POST", json: { role: "creator" } })).resolves.toBeUndefined();
  });

  it("sends JSON bodies under /api", async () => {
    const fetch = reply(204);
    vi.stubGlobal("fetch", fetch);
    await api("/me/role", { method: "POST", json: { role: "brand" } });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/me/role");
    expect(init.body).toBe('{"role":"brand"}');
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("throws ApiClientError with status, code and i18n message", async () => {
    vi.stubGlobal(
      "fetch",
      reply(409, { error: { code: "role_already_set", message: "errors.role_already_set" } }),
    );
    const err = await api("/me/role", { method: "POST", json: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ status: 409, code: "role_already_set", message: "errors.role_already_set" });
  });

  it("survives a non-JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Bad gateway", { status: 502 })),
    );
    await expect(api("/me")).rejects.toMatchObject({ status: 502, code: "unknown" });
  });
});

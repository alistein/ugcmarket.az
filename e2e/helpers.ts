import { expect, test as base, type Page } from "@playwright/test";

/**
 * Supabase admin helpers for e2e. They use the service role key from .env.local and never
 * send email themselves: codes come from the admin generate_link API, and any email the UI
 * sends goes to Resend's test inbox (delivered+…@resend.dev), so no real person is mailed.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** fetch with retries: the network to Supabase occasionally drops a connection. */
async function retryFetch(input: string, init: RequestInit, tries = 4): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      return await fetch(input, { ...init, signal: AbortSignal.timeout(15_000) });
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
}

async function admin(path: string, init: RequestInit = {}) {
  const res = await retryFetch(`${url}/auth/v1/admin${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const created = new Set<string>();

/** A fresh address in Resend's test inbox, tagged so leftovers are easy to find. */
export function testEmail(tag: string) {
  return `delivered+e2e-${tag}-${Date.now()}@resend.dev`;
}

export const PASSWORD = "e2eTest1234";

/** What Supabase stores for an account made with "Continue with Google". */
const GOOGLE_METADATA = (email: string) => ({
  user_metadata: {
    iss: "https://accounts.google.com",
    sub: "1".repeat(21),
    name: "Test Kreator",
    full_name: "Test Kreator",
    email,
    email_verified: true,
    phone_verified: false,
    picture: `https://lh3.googleusercontent.com/a/${"x".repeat(80)}=s96-c`,
    avatar_url: `https://lh3.googleusercontent.com/a/${"x".repeat(80)}=s96-c`,
    provider_id: "1".repeat(21),
  },
  app_metadata: { provider: "google", providers: ["google"] },
});

/**
 * A confirmed account (optionally with a role), created without any email. `google: true`
 * gives it the metadata a Google sign-in leaves (name, picture, provider), so the session
 * cookie looks like a real Google user's. It still gets a password so the UI can sign in.
 */
export async function createUser(
  email: string,
  opts: { role?: "brand" | "creator"; google?: boolean } = {},
) {
  const { status, body } = await admin("/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      ...(opts.google && GOOGLE_METADATA(email)),
    }),
  });
  expect(status, JSON.stringify(body)).toBe(200);
  created.add(body.id);
  if (opts.role) {
    const res = await retryFetch(`${url}/rest/v1/profiles?id=eq.${body.id}`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role: opts.role }),
    });
    expect(res.ok).toBe(true);
  }
  return body.id as string;
}

/** Remembers users the UI created, so cleanup can delete them. */
export async function trackUser(email: string) {
  const { body } = await admin(`/users?per_page=50&filter=${encodeURIComponent(email)}`);
  const user = (body?.users ?? []).find((u: { email: string }) => u.email === email);
  if (user) created.add(user.id);
  return user as { id: string; email_confirmed_at: string | null } | undefined;
}

export async function deleteCreatedUsers() {
  for (const id of created) await admin(`/users/${id}`, { method: "DELETE" });
  created.clear();
}

/**
 * Fresh 6-digit code for `email` (replaces the one the UI just emailed). Supabase allows one
 * token per user per 60s, so this waits out the cooldown when the UI has just sent one.
 */
export async function mintCode(
  email: string,
  type: "magiclink" | "signup" | "recovery" = "magiclink",
  password?: string,
) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const { status, body } = await admin("/generate_link", {
      method: "POST",
      body: JSON.stringify({ type, email, ...(password && { password }) }),
    });
    const otp = body?.email_otp ?? body?.properties?.email_otp;
    if (status === 200 && otp) return String(otp);
    if (status !== 429) throw new Error(`generate_link ${status}: ${JSON.stringify(body)}`);
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error("generate_link kept rate limiting");
}

export async function fillCode(page: Page, code: string) {
  const input = page.getByLabel("Kod", { exact: true });
  await input.fill(code);
}

/** Onboarding: pick a role and continue; lands on that role's home. */
export async function chooseRole(page: Page, role: "brand" | "creator") {
  await expect(page).toHaveURL(/\/az\/onboarding/);
  await page.getByText(role === "brand" ? "Brend" : "Kreator", { exact: true }).click();
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(page).toHaveURL(role === "brand" ? /\/az\/brand/ : /\/az\/me/);
  await expect(page.getByText("Xəta baş verdi")).toHaveCount(0);
}

/** Open a page and wait until React has hydrated (dev compiles on first hit). */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** `test` that logs any Supabase call slower than 5s, to catch hangs like a stuck code screen. */
export const test = base.extend<{ slowCalls: void }>({
  slowCalls: [
    async ({ page }, use) => {
      const started = new Map<object, number>();
      page.on("request", (r) => r.url().includes("supabase.co") && started.set(r, Date.now()));
      const report = (r: { url(): string }, what: string) => {
        const t0 = started.get(r);
        if (t0 && Date.now() - t0 > 5_000)
          console.log(`[slow supabase] ${what} ${Date.now() - t0}ms ${r.url().split("?")[0]}`);
      };
      const done = (r: object) => started.delete(r);
      page.on("requestfinished", (r) => (report(r, "done"), done(r)));
      page.on("requestfailed", (r) => (report(r, "failed"), done(r)));
      await use();
      for (const [r, t0] of started)
        console.log(`[hung supabase] ${Date.now() - t0}ms ${(r as { url(): string }).url().split("?")[0]}`);
    },
    { auto: true },
  ],
});

/**
 * Click "Kod göndər" and wait for the code field. Supabase limits how often one IP may request
 * codes, and this suite requests many; on "Çox tez-tez cəhd edirsiniz" it waits and retries.
 */
export async function sendCode(page: Page) {
  const code = page.getByLabel("Kod", { exact: true });
  // auth.errors.too_many_emails / too_many_requests
  const tooOften = page.getByText(/Çox tez-tez cəhd edirsiniz|Cəhdlərin sayı çox oldu/);
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.getByRole("button", { name: "Kod göndər" }).click();
    await expect(code.or(tooOften)).toBeVisible({ timeout: 30_000 });
    if (await code.isVisible()) return;
    await page.waitForTimeout(61_000);
  }
  throw new Error("Supabase kept rate limiting code requests");
}

/** Password login through the UI. */
export async function login(page: Page, email: string, password = PASSWORD) {
  await open(page, "/az/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Daxil ol" }).click();
}

/** Asserts the page settled on `path` and was not bounced to login or onboarding. */
export async function expectStaysOn(page: Page, path: RegExp) {
  // Not "networkidle": after a Google sign-in page, Google's script keeps the network busy.
  await expect(page).toHaveURL(path);
  // RoleGate redirects after /api/me answers; give it a moment, then check again.
  await page.waitForTimeout(2_000);
  await expect(page).toHaveURL(path);
  await expect(page).not.toHaveURL(/\/login|\/onboarding/);
}

/**
 * Records every request for a login page from now on. A signed-in user should never hit one:
 * the server bounces it back (so the final URL looks fine), but the user sees login flash.
 */
export function watchLoginBounces(page: Page) {
  const hits: string[] = [];
  page.on("request", (r) => {
    if (/\/(az|ru|en)\/login(\?|$)/.test(new URL(r.url()).pathname + new URL(r.url()).search.slice(0, 1)))
      hits.push(r.url());
  });
  return hits;
}

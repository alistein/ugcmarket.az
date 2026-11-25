import { expect } from "@playwright/test";
import {
  apiEmail,
  chooseRole,
  createUser,
  deleteCreatedUsers,
  deleteUser,
  fillCode,
  isMarked,
  login,
  markDocument,
  mintCode,
  open,
  PASSWORD,
  sendCode,
  signOut,
  test,
  testEmail,
  trackUser,
} from "./helpers";

/**
 * Regressions from the 2026-11-25 auth audit (wiki: decisions/auth-state-bugs). Each test is one
 * bug that reached production: state of a previous user or a previous attempt leaking into the
 * next one, because Next keeps visited pages mounted and events can fire twice.
 */
test.afterEach(deleteCreatedUsers);
// Waits out Supabase's per-IP code limit when needed.
test.setTimeout(300_000);

const TOO_OFTEN = /Çox tez-tez cəhd edirsiniz|Cəhdlərin sayı çox oldu/;

/** Submit the password sign-up form; retries after Supabase's rate limit. */
async function submitSignup(page: import("@playwright/test").Page, settled: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.getByRole("button", { name: "Qeydiyyatdan keç" }).click();
    await expect
      .poll(async () => (await settled()) || (await page.getByText(TOO_OFTEN).isVisible()), {
        timeout: 30_000,
      })
      .toBe(true);
    if (await settled()) return;
    await page.waitForTimeout(61_000);
  }
  throw new Error("Supabase kept rate limiting sign-ups");
}

test("sign up with X, go back, sign up with Y: the code screen shows and verifies Y", async ({ page }) => {
  const first = testEmail("reg-first");
  const second = testEmail("reg-second");

  await open(page, "/az/signup");
  await page.getByLabel("E-poçt").fill(first);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await submitSignup(page, async () => /\/az\/verify-email/.test(page.url()));
  await trackUser(first);
  await expect(page.getByText(first)).toBeVisible();

  // Browser back is a client-side navigation: Next brings back the kept sign-up page.
  await page.goBack();
  await expect(page).toHaveURL(/\/az\/signup/);
  // The verify page is still in the DOM (hidden), with an email field of its own.
  await page.getByLabel("E-poçt").filter({ visible: true }).fill(second);
  await page.getByLabel("Şifrə", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await submitSignup(page, async () => page.url().includes(encodeURIComponent(second)));
  await trackUser(second);

  await expect(page.getByText(second)).toBeVisible();
  await expect(page.getByText(first).filter({ visible: true })).toHaveCount(0);
  // The code for Y is accepted, so the screen verifies against Y, not X.
  await fillCode(page, await mintCode(second, "signup", PASSWORD));
  await chooseRole(page, "brand");
  expect(await apiEmail(page)).toBe(second);
});

test("sign up with an email that already has an account: a sign-in code is sent", async ({ page }) => {
  const email = testEmail("reg-existing");
  await createUser(email, { google: true });

  await open(page, "/az/signup");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill("anotherPass123");
  // Supabase sends nothing for a confirmed account, so the app must ask for a sign-in code.
  const otpRequest = page.waitForRequest((r) => r.url().includes("/auth/v1/otp"), { timeout: 280_000 });
  const code = page.getByLabel("Kod", { exact: true });
  await submitSignup(page, () => code.isVisible());
  await otpRequest;

  await fillCode(page, await mintCode(email));
  await chooseRole(page, "creator");
  expect(await apiEmail(page)).toBe(email);
});

test("a new account arriving with ?next= picks a role first, then continues there", async ({ page }) => {
  const email = testEmail("reg-next");
  await createUser(email, { google: true });

  await open(page, "/az/login?next=/az/campaigns");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Daxil ol" }).click();

  await expect(page).toHaveURL(/\/az\/onboarding\?next=/);
  await page.getByText("Kreator", { exact: true }).click();
  await page.getByRole("button", { name: "Davam et" }).click();
  await expect(page).toHaveURL(/\/az\/campaigns$/);
});

test("sign out, then another user signs in: both are full page loads, no data of the first", async ({
  page,
}) => {
  const a = testEmail("reg-user-a");
  const b = testEmail("reg-user-b");
  await createUser(a, { role: "creator" });
  await createUser(b, { role: "brand" });

  await login(page, a);
  await expect(page).toHaveURL(/\/az\/me/);
  expect(await apiEmail(page)).toBe(a);

  await markDocument(page);
  await signOut(page);
  expect(await isMarked(page), "sign-out must reload the page").toBe(false);
  expect(await apiEmail(page)).toBeNull();

  // Same tab, no reload in between: sign in as B from the login page we landed on.
  await page.waitForLoadState("networkidle");
  await markDocument(page);
  await page.getByLabel("E-poçt").fill(b);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/\/az\/brand/);
  expect(await isMarked(page), "sign-in must reload the page").toBe(false);
  expect(await apiEmail(page)).toBe(b);
});

test("signing out in one tab takes the other tab to login", async ({ page, context }) => {
  const email = testEmail("reg-tabs");
  await createUser(email, { role: "creator" });
  await login(page, email);
  await expect(page).toHaveURL(/\/az\/me/);

  const other = await context.newPage();
  await open(other, "/az/me/applications");
  await expect(other).toHaveURL(/\/az\/me\/applications$/);

  await signOut(page);
  await expect(other).toHaveURL(/\/az\/login/);
});

test("one code entry sends one verify request, even when the input fires twice", async ({ page }) => {
  const email = testEmail("reg-double");
  await createUser(email);
  await open(page, "/az/login");
  await page.getByRole("tab", { name: "Kod ilə" }).click();
  // Both tabs have an email field (and both show for a moment while the tab switches).
  await page.getByRole("tabpanel", { name: "Kod ilə" }).getByLabel("E-poçt").fill(email);
  await sendCode(page);
  const code = await mintCode(email);

  let verifies = 0;
  page.on("request", (r) => {
    if (r.url().includes("/auth/v1/verify")) verifies++;
  });
  // What phone autofill does: two input events in the same tick (the second with a stray digit).
  await page.getByLabel("Kod", { exact: true }).evaluate((el, value) => {
    const input = el as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (const v of [value, `${value}7`]) {
      set.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, code);

  await expect(page).toHaveURL(/\/az\/onboarding/);
  // auth.errors.code_invalid (Next's own route announcer is also role="alert", so match the text).
  await expect(page.getByText("Kod yanlışdır")).toHaveCount(0);
  expect(verifies).toBe(1);
});

test("an account deleted while signed in ends on login, not in an onboarding loop", async ({ page }) => {
  const email = testEmail("reg-deleted");
  const id = await createUser(email);
  await login(page, email);
  await expect(page).toHaveURL(/\/az\/onboarding/);

  await deleteUser(id);
  await page.goto("/az/onboarding");
  await expect(page).toHaveURL(/\/az\/login/);
  await page.waitForTimeout(3_000);
  await expect(page).toHaveURL(/\/az\/login/);
  expect(await apiEmail(page)).toBeNull();
});

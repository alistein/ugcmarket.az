import { expect } from "@playwright/test";
import {
  chooseRole,
  createUser,
  deleteCreatedUsers,
  fillCode,
  mintCode,
  open,
  sendCode,
  PASSWORD,
  test,
  testEmail,
  trackUser,
} from "./helpers";

/**
 * Every way into the app, end to end against the real Supabase project:
 * code signup, password signup + confirmation, password login, code login, password reset,
 * `?next=` handling and the route guards. Users are deleted after each test.
 */
test.afterEach(deleteCreatedUsers);
// Waits out Supabase's per-IP code limit when needed (see sendCode).
test.setTimeout(300_000);

test("signup with an email code → onboarding → creator home", async ({ page }) => {
  const email = testEmail("code-signup");
  await open(page, "/az/signup");
  await page.getByRole("button", { name: "Şifrəsiz, kod ilə qeydiyyat" }).click();
  await page.getByLabel("E-poçt").fill(email);
  await sendCode(page);
  await trackUser(email);

  await fillCode(page, await mintCode(email));
  await chooseRole(page, "creator");
});

test("signup with a password → confirm code → onboarding → brand home", async ({ page }) => {
  const email = testEmail("pw-signup");
  await open(page, "/az/signup");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Qeydiyyatdan keç" }).click();
  await expect(page).toHaveURL(/\/az\/verify-email/);
  const user = await trackUser(email);
  expect(user?.email_confirmed_at).toBeFalsy();

  await fillCode(page, await mintCode(email, "signup", PASSWORD));
  await chooseRole(page, "brand");
});

test("password login, new account → onboarding", async ({ page }) => {
  const email = testEmail("pw-login");
  await createUser(email);
  await open(page, "/az/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await chooseRole(page, "creator");
});

test("wrong password shows an error and keeps the email", async ({ page }) => {
  const email = testEmail("pw-wrong");
  await createUser(email);
  await open(page, "/az/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill("wrongPass123");
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/az\/login/);
  await expect(page.getByLabel("E-poçt")).toHaveValue(email);
});

test("code login, existing creator → straight to /me", async ({ page }) => {
  const email = testEmail("code-login");
  await createUser(email, { role: "creator" });
  await open(page, "/az/login");
  await page.getByRole("tab", { name: "Kod ilə" }).click();
  await page.getByLabel("E-poçt").fill(email);
  await sendCode(page);
  await fillCode(page, await mintCode(email));
  await expect(page).toHaveURL(/\/az\/me/);
});

test("wrong code shows an error and allows another try", async ({ page }) => {
  const email = testEmail("code-wrong");
  await createUser(email);
  await open(page, "/az/login");
  await page.getByRole("tab", { name: "Kod ilə" }).click();
  await page.getByLabel("E-poçt").fill(email);
  await sendCode(page);
  await fillCode(page, "000000");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Kod", { exact: true })).toBeEnabled();
  await fillCode(page, await mintCode(email));
  await chooseRole(page, "brand");
});

test("password reset with a code, then login with the new password", async ({ page }) => {
  const email = testEmail("reset");
  await createUser(email, { role: "brand" });
  const newPassword = "brandNew5678";

  await open(page, "/az/login");
  await expect(page.getByRole("link", { name: "Şifrəni unutmusunuz?" })).toHaveAttribute(
    "href",
    "/az/reset-password",
  );
  await open(page, "/az/reset-password");
  await page.getByLabel("E-poçt").fill(email);
  await sendCode(page);
  await page.getByLabel("Kod", { exact: true }).fill(await mintCode(email, "recovery"));
  await page.getByLabel("Yeni şifrə").fill(newPassword);
  await page.getByLabel("Şifrənin təkrarı").fill(newPassword);
  await page.getByRole("button", { name: "Şifrəni yenilə" }).click();
  await expect(page).toHaveURL(/\/az\/brand/);

  await page.context().clearCookies();
  await open(page, "/az/login");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/\/az\/brand/);
});

test("?next= survives login; protected pages bounce to login", async ({ page }) => {
  const email = testEmail("next");
  await createUser(email, { role: "creator" });

  await open(page, "/az/me/profile");
  await expect(page).toHaveURL(/\/az\/login\?next=%2Faz%2Fme%2Fprofile/);
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/\/az\/me\/profile/);

  // Signed in: guest-only pages send you home, a foreign `next` is ignored.
  await open(page, "/az/signup");
  await expect(page).not.toHaveURL(/\/signup/);
});

test("open redirect: an external ?next= is ignored", async ({ page }) => {
  const email = testEmail("evil-next");
  await createUser(email, { role: "creator" });
  await open(page, "/az/login?next=//evil.example.com");
  await page.getByLabel("E-poçt").fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/localhost:3100\/az\/me/);
});

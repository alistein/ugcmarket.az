import { expect } from "@playwright/test";
import {
  chooseRole,
  createUser,
  deleteCreatedUsers,
  expectStaysOn,
  login,
  open,
  PASSWORD,
  test,
  testEmail,
  watchLoginBounces,
} from "./helpers";

/**
 * What a brand-new account does right after signing up: pick a role, land in the profile editor
 * (creators go straight there, brands press "start" on the empty home), move around its area. Runs for a password account
 * and a Google-shaped one (Google metadata makes the session cookie bigger and split in parts).
 * Regression: a Google creator pressing "Profili yaratmağa başla" was sent to /login.
 */
test.afterEach(deleteCreatedUsers);

const START = "Profili yaratmağa başla";

for (const google of [false, true]) {
  const kind = google ? "google" : "password";

  test(`${kind}: new creator → start → profile editor, all creator pages open`, async ({ page }) => {
    const email = testEmail(`${kind}-creator`);
    await createUser(email, { google });
    await login(page, email);
    await chooseRole(page, "creator");

    // No profile yet: /me goes straight to the setup form (no "start" screen for creators).
    await expectStaysOn(page, /\/az\/me\/profile$/);

    await page.reload();
    await expectStaysOn(page, /\/az\/me\/profile$/);

    for (const path of ["/az/me/applications", "/az/me/posts"]) {
      await open(page, path);
      await expectStaysOn(page, new RegExp(`${path}$`));
    }
    await open(page, "/az/me");
    await expectStaysOn(page, /\/az\/me\/profile$/);
    // Wrong area → own home (the setup form while there is no profile), not login.
    await open(page, "/az/brand");
    await expectStaysOn(page, /\/az\/me\/profile$/);
  });

  test(`${kind}: new brand → start → brand profile, all brand pages open`, async ({ page }) => {
    const email = testEmail(`${kind}-brand`);
    await createUser(email, { google });
    await login(page, email);
    await chooseRole(page, "brand");

    await page.getByRole("button", { name: START }).click();
    await expectStaysOn(page, /\/az\/brand\/profile$/);

    await page.reload();
    await expectStaysOn(page, /\/az\/brand\/profile$/);

    await open(page, "/az/brand");
    await expectStaysOn(page, /\/az\/brand$/);
    await open(page, "/az/me");
    await expectStaysOn(page, /\/az\/brand$/);
  });
}

test("session survives a new tab and the onboarding page sends a creator home", async ({ page, context }) => {
  const email = testEmail("tabs");
  await createUser(email, { role: "creator", google: true });
  await login(page, email);
  await expect(page).toHaveURL(/\/az\/me/);

  const tab = await context.newPage();
  await open(tab, "/az/me/profile");
  await expectStaysOn(tab, /\/az\/me\/profile$/);
  await open(tab, "/az/onboarding");
  await expectStaysOn(tab, /\/az\/me\/profile$/);
});

/**
 * Regression: a page that asked "who am I?" while signed out cached `null`. After signing in,
 * onboarding and the role areas read that stale `null` before the refetch finished and sent the
 * user to /login (the server bounced them back, so it looked like a random trip to login).
 */
for (const google of [false, true]) {
  test(`${google ? "google" : "password"}: no trip to /login after signing in from a public page`, async ({
    page,
  }) => {
    const email = testEmail(`${google ? "google" : "password"}-bounce`);
    await createUser(email, { google });

    // Public page with the header: caches "signed out" for the current user.
    await open(page, "/az/creator/nobody-e2e"); // not-found page, still has the header
    await page.getByRole("button", { name: "Daxil ol" }).first().click();
    await expect(page).toHaveURL(/\/az\/login/);
    await page.getByLabel("E-poçt").fill(email);
    await page.getByLabel("Şifrə", { exact: true }).fill(PASSWORD);

    const bounces = watchLoginBounces(page);
    await page.getByRole("button", { name: "Daxil ol" }).last().click();
    await chooseRole(page, "creator");
    await expectStaysOn(page, /\/az\/me\/profile$/);
    expect(bounces, "signed-in user was sent to a login page").toEqual([]);
  });
}

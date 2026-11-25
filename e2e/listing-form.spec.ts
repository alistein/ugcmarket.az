import { expect } from "@playwright/test";
import { createBrand, createUser, deleteCreatedUsers, login, test, testEmail } from "./helpers";

/**
 * The create-listing wizard after a save. Next keeps visited pages mounted (hidden, state intact),
 * so "Elan yerləşdir" used to bring back the previous listing's step and values (PM, 2026-11-25).
 */
test.afterEach(deleteCreatedUsers);

test("after saving a listing, the next one starts empty on step 1", async ({ page }) => {
  const email = testEmail("listing-reset");
  await createBrand(await createUser(email, { role: "brand" }));
  await login(page, email);
  await expect(page).toHaveURL(/\/az\/brand$/);

  const newListing = page.getByRole("banner").getByRole("button", { name: "Elan yerləşdir" });
  const title = page.getByLabel("Elanın adı");

  await newListing.click();
  await expect(page.getByText("Addım 1/3")).toBeVisible();
  await title.fill("Birinci elan");
  await page.getByRole("button", { name: "Qaralama kimi saxla" }).click();
  await expect(page.getByText("Elan qaralama kimi saxlanıldı")).toBeVisible();
  await expect(page).toHaveURL(/\/az\/brand$/);

  // Client navigation back to the kept page, as the PM did.
  await newListing.click();
  await expect(page).toHaveURL(/\/az\/brand\/campaigns\/new$/);
  await expect(page.getByText("Addım 1/3")).toBeVisible();
  await expect(title).toHaveValue("");
});

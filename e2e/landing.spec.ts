import { expect } from "@playwright/test";
import { createUser, deleteCreatedUsers, login, open, test, testEmail } from "./helpers";

/** Landing header: "get started" for visitors, avatar and name for signed-in users. */
test.afterEach(deleteCreatedUsers);

test("signed-out landing shows only the sign-up button and asks the API nothing", async ({ page }) => {
  let meCalls = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/me") meCalls++;
  });
  await open(page, "/az");
  const header = page.getByRole("banner");
  await expect(header.getByRole("button", { name: "başlayın" })).toBeVisible();
  await expect(header.getByRole("button", { name: "daxil olun" })).toHaveCount(0);
  // The header must not cost signed-out visitors a request.
  expect(meCalls).toBe(0);
});

test("signed-in landing shows the account instead, linking to its home", async ({ page }) => {
  const email = testEmail("landing");
  await createUser(email, { role: "brand" });
  await login(page, email);
  await expect(page).toHaveURL(/\/az\/brand/);

  await open(page, "/az");
  const header = page.getByRole("banner");
  // No brand profile yet, so the name falls back to the email.
  const account = header.getByRole("button", { name: email });
  await expect(account).toBeVisible();
  await expect(account).toHaveAttribute("href", "/az/brand");
  await expect(header.getByRole("button", { name: "başlayın" })).toHaveCount(0);
});

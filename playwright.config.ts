import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Same env as `next dev` (.env.local): the auth tests talk to the real Supabase project and
// clean up every user they create. See e2e/README.md.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "az-AZ",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Emails on (code screens visible); its own port so it never clashes with your `pnpm dev`.
    command: `pnpm exec next dev --port ${PORT}`,
    env: { NEXT_PUBLIC_AUTH_EMAIL: "1", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
    url: `http://localhost:${PORT}/az/login`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

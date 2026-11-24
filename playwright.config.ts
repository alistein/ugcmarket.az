import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Same env as `next dev` (.env.local): the auth tests talk to the real Supabase project and
// clean up every user they create. See e2e/README.md.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3100;
// E2E_PROD=1 runs against a production build (prefetching, caching and the proxy behave as on
// Vercel). Default is `next dev`, which is faster to start.
const PROD = process.env.E2E_PROD === "1";

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
    command: PROD
      ? `pnpm exec next build && pnpm exec next start --port ${PORT}`
      : `pnpm exec next dev --port ${PORT}`,
    env: { NEXT_PUBLIC_AUTH_EMAIL: "1", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
    url: `http://localhost:${PORT}/az/login`,
    reuseExistingServer: false,
    timeout: PROD ? 600_000 : 180_000,
  },
});

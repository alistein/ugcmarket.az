# End-to-end tests (Playwright)

`pnpm test:e2e` runs every sign-in and sign-up flow in a real browser:
code signup, password signup + confirmation code, password login, code login, wrong password,
wrong code, password reset, `?next=` and the route guards, open-redirect protection.

`after-signup.spec.ts` covers what a new account does next: pick a role, press "Profili yaratmağa
başla", land in the profile editor and open every page of that area, for brand and creator, with a
password account and a Google-shaped one (`createUser(email, { google: true })`). It also fails if a
signed-in user is ever sent to a login page, even when the server bounces them back.

`regressions.spec.ts` holds one test per bug from the 2026-11-25 auth audit (previous email on the
code screen, sign-up with an existing email, `?next=` skipping the role pick, sign-out and user
switch as full page loads, sign-out across tabs, one verify request per code, deleted account).
`landing.spec.ts` covers the landing header for visitors and signed-in users.

- `next dev` refuses a second server in the same folder: while your own `pnpm dev` is running, use
  the production-build mode below.
- `E2E_PROD=1 pnpm test:e2e` runs against a production build (`next build` + `next start`) instead.
- Starts its own `next dev` on port 3100 with `NEXT_PUBLIC_AUTH_EMAIL=1`, so it never clashes with your `pnpm dev`.
- Talks to the Supabase project in `.env.local` (needs `SUPABASE_SERVICE_ROLE_KEY`).
- Never emails a real person: codes come from the admin `generate_link` API, and emails the UI
  sends go to Resend's test inbox (`delivered+e2e-…@resend.dev`).
- Deletes every user it creates after each test. Leftovers, if a run is killed, have emails
  starting with `delivered+e2e-`.
- Supabase limits how often one IP may request codes; the suite waits and retries when that happens,
  so a run can take a few minutes.

First run: `pnpm exec playwright install chromium`.
Unit tests (no network): `pnpm test`.

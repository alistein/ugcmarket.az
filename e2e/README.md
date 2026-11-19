# End-to-end tests (Playwright)

`pnpm test:e2e` runs every sign-in and sign-up flow in a real browser:
code signup, password signup + confirmation code, password login, code login, wrong password,
wrong code, password reset, `?next=` and the route guards, open-redirect protection.

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

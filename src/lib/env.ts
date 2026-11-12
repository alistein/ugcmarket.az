// Public env vars (safe in the browser). Server secrets live in src/server/env.ts.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  /**
   * Auth emails (signup confirmation, email codes, password reset). Off until the domain and
   * SMTP (Resend) are set up: password + Google only, no "Confirm email" in Supabase. Set "1" to enable.
   */
  authEmail: process.env.NEXT_PUBLIC_AUTH_EMAIL === "1",
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
};

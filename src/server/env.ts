import "server-only";

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "UGCMarket <noreply@ugcmarket.az>",

  // Social stats providers (src/server/social). Each is skipped when its vars are empty.
  igBusinessAccountId: process.env.IG_BUSINESS_ACCOUNT_ID ?? "",
  igGraphToken: process.env.IG_GRAPH_TOKEN ?? "",
  apifyToken: process.env.APIFY_TOKEN ?? "",
  apifyInstagramActor: process.env.APIFY_INSTAGRAM_ACTOR || "apify/instagram-profile-scraper",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  /** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
  cronSecret: process.env.CRON_SECRET ?? "",
};

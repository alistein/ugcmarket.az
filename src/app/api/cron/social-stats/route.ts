import { timingSafeEqual } from "node:crypto";
import { errors } from "@/server/http/errors";
import { handler, ok } from "@/server/http/handler";
import { serverEnv } from "@/server/env";
import { refreshStaleStats } from "@/server/services/social-stats";

/**
 * Daily (vercel.json → crons). Re-checks social numbers and portfolio posts older than a week,
 * oldest first, within a time budget; the next run continues. Vercel calls it with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export const GET = handler(async (req) => {
  const expected = `Bearer ${serverEnv.cronSecret}`;
  const got = req.headers.get("authorization") ?? "";
  const valid =
    !!serverEnv.cronSecret &&
    got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected));
  if (!valid) throw errors.unauthorized();
  return ok(await refreshStaleStats({ budgetMs: 240_000 }));
});

export const maxDuration = 300;

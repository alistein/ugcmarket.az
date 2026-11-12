import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { getMyCreator } from "@/server/services/creators";
import { refreshMySocialStats } from "@/server/services/social-stats";

/** Re-check the creator's public social numbers now (rate limited: once an hour). */
export const POST = handler(async () => {
  const user = await requireRole("creator");
  const me = await getMyCreator(user);
  return ok(await refreshMySocialStats(user, me.id));
});

// Third-party providers can take up to ~2 minutes.
export const maxDuration = 120;

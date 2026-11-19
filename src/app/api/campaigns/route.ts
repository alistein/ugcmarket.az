import { CampaignDraft, CampaignFilters } from "@/schemas";
import { getUser, requireRole } from "@/server/auth";
import { handler, ok, parseBody, parseQuery } from "@/server/http/handler";
import { createCampaign, listBoard } from "@/server/services/campaigns";

/** Public campaign board. */
/** Public board. Pay is hidden from signed-out visitors (see campaigns service). */
export const GET = handler(async (req) => ok(await listBoard(parseQuery(req, CampaignFilters), await getUser())));

/** New listings start as drafts, so they may be half-filled (publishing checks the rest). */
export const POST = handler(async (req) => {
  const user = await requireRole("brand");
  return ok(await createCampaign(user, await parseBody(req, CampaignDraft)), 201);
});

import { CampaignFilters, CampaignInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody, parseQuery } from "@/server/http/handler";
import { createCampaign, listBoard } from "@/server/services/campaigns";

/** Public campaign board. */
export const GET = handler(async (req) => ok(await listBoard(parseQuery(req, CampaignFilters))));

export const POST = handler(async (req) => {
  const user = await requireRole("brand");
  return ok(await createCampaign(user, await parseBody(req, CampaignInput)), 201);
});

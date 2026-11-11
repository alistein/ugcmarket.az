import { CampaignStatusChange } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { changeCampaignStatus } from "@/server/services/campaigns";

export const POST = handler<{ id: string }>(async (req, { params }) => {
  const user = await requireRole("brand");
  return ok(await changeCampaignStatus(user, (await params).id, await parseBody(req, CampaignStatusChange)));
});

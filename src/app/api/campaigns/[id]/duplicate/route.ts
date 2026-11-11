import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { duplicateCampaign } from "@/server/services/campaigns";

export const POST = handler<{ id: string }>(async (_req, { params }) => {
  const user = await requireRole("brand");
  return ok(await duplicateCampaign(user, (await params).id), 201);
});

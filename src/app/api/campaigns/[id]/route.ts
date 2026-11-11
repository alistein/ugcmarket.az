import { CampaignUpdate } from "@/schemas";
import { requireRole } from "@/server/auth";
import { errors } from "@/server/http/errors";
import { handler, ok, parseBody } from "@/server/http/handler";
import { getOwnCampaign, getPublicCampaign, updateCampaign } from "@/server/services/campaigns";

/** Public detail; `?own=1` returns the owner's view (any status). */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  if (new URL(req.url).searchParams.get("own")) return ok(await getOwnCampaign(await requireRole("brand"), id));
  const campaign = await getPublicCampaign(id);
  if (!campaign) throw errors.notFound("campaign");
  return ok(campaign);
});

export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  const user = await requireRole("brand");
  return ok(await updateCampaign(user, (await params).id, await parseBody(req, CampaignUpdate)));
});

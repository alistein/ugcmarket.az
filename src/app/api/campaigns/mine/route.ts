import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { listMyCampaigns } from "@/server/services/campaigns";

export const GET = handler(async () => ok(await listMyCampaigns(await requireRole("brand"))));

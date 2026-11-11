import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { listMyApplications } from "@/server/services/applications";

export const GET = handler(async () => ok(await listMyApplications(await requireRole("creator"))));

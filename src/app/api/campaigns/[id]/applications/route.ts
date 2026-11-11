import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { listApplicants } from "@/server/services/applications";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const user = await requireRole("brand");
  return ok(await listApplicants(user, (await params).id));
});

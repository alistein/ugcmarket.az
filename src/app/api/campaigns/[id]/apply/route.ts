import { ApplicationInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { apply } from "@/server/services/applications";

/** Logs the application and returns the brand's contact (Instagram/phone). */
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const user = await requireRole("creator");
  const input = await parseBody(req, ApplicationInput);
  return ok(await apply(user, (await params).id, input), 201);
});

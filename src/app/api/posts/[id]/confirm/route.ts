import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { confirmPost } from "@/server/services/posts";

export const POST = handler<{ id: string }>(async (_req, { params }) => {
  const user = await requireRole("brand");
  return ok(await confirmPost(user, (await params).id));
});

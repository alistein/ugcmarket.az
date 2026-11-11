import { CreatorProfileInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { createMyCreator } from "@/server/services/creators";

export const POST = handler(async (req) => {
  const user = await requireRole("creator");
  return ok(await createMyCreator(user, await parseBody(req, CreatorProfileInput)), 201);
});

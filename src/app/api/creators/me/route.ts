import { CreatorProfileUpdate } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { getMyCreator, updateMyCreator } from "@/server/services/creators";

export const GET = handler(async () => ok(await getMyCreator(await requireRole("creator"))));

export const PATCH = handler(async (req) => {
  const user = await requireRole("creator");
  return ok(await updateMyCreator(user, await parseBody(req, CreatorProfileUpdate)));
});

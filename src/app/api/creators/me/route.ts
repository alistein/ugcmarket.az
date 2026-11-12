import { CreatorProfileUpdate } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { findMyCreator, updateMyCreator } from "@/server/services/creators";

/** Own profile, or null before setup (so the client can show the wizard without a 404). */
export const GET = handler(async () => ok(await findMyCreator(await requireRole("creator"))));

export const PATCH = handler(async (req) => {
  const user = await requireRole("creator");
  return ok(await updateMyCreator(user, await parseBody(req, CreatorProfileUpdate)));
});

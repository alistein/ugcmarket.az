import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { getCreatorContactsForBrand } from "@/server/services/creators";

/** Phone, email and Instagram of an approved creator, for signed-in brands only. */
export const GET = handler<{ handle: string }>(async (_req, { params }) => {
  const user = await requireRole("brand");
  return ok(await getCreatorContactsForBrand(user, (await params).handle));
});

import { BrandProfileInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { findMyBrand, updateMyBrand } from "@/server/services/brands";

/** Own brand, or null before setup (so the client can show the setup intro without a 404). */
export const GET = handler(async () => ok(await findMyBrand(await requireRole("brand"))));

/** The profile form always sends every field (see BrandProfileInput). */
export const PATCH = handler(async (req) => {
  const user = await requireRole("brand");
  return ok(await updateMyBrand(user, await parseBody(req, BrandProfileInput)));
});

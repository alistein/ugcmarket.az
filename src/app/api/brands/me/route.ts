import { BrandProfileInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { getMyBrand, updateMyBrand } from "@/server/services/brands";

export const GET = handler(async () => ok(await getMyBrand(await requireRole("brand"))));

export const PATCH = handler(async (req) => {
  const user = await requireRole("brand");
  return ok(await updateMyBrand(user, await parseBody(req, BrandProfileInput.partial())));
});

import { BrandProfileInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { createMyBrand } from "@/server/services/brands";

export const POST = handler(async (req) => {
  const user = await requireRole("brand");
  return ok(await createMyBrand(user, await parseBody(req, BrandProfileInput)), 201);
});

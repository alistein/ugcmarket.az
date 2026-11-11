import { PortfolioItemInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { addPortfolioItem } from "@/server/services/creators";

export const POST = handler(async (req) => {
  const user = await requireRole("creator");
  return ok(await addPortfolioItem(user, await parseBody(req, PortfolioItemInput)), 201);
});

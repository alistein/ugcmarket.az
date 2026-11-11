import { requireRole } from "@/server/auth";
import { handler, noContent } from "@/server/http/handler";
import { removePortfolioItem } from "@/server/services/creators";

export const DELETE = handler<{ id: string }>(async (_req, { params }) => {
  const user = await requireRole("creator");
  await removePortfolioItem(user, (await params).id);
  return noContent();
});

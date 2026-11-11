import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { stats } from "@/server/services/admin";

export const GET = handler(async () => {
  await requireRole("admin");
  return ok(await stats());
});

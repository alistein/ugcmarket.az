import { z } from "zod";
import { requireRole } from "@/server/auth";
import { handler, ok } from "@/server/http/handler";
import { listQueue } from "@/server/services/admin";

export const GET = handler<{ kind: string }>(async (_req, { params }) => {
  await requireRole("admin");
  const kind = z.enum(["creators", "brands", "campaigns"]).parse((await params).kind);
  return ok(await listQueue(kind));
});

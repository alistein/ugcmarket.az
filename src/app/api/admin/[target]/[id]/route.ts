import { z } from "zod";
import { ModerationAction } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, noContent, parseBody } from "@/server/http/handler";
import { moderate } from "@/server/services/admin";

/** POST /api/admin/{creator|brand|campaign|user}/{id}  body: { action, reason? } */
export const POST = handler<{ target: string; id: string }>(async (req, { params }) => {
  const admin = await requireRole("admin");
  const { target, id } = await params;
  const t = z.enum(["creator", "brand", "campaign", "user"]).parse(target);
  await moderate(admin, t, id, await parseBody(req, ModerationAction));
  return noContent();
});

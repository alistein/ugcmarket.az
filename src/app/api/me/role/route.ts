import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handler, noContent, parseBody } from "@/server/http/handler";
import { setRole } from "@/server/services/me";

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { role } = await parseBody(req, z.object({ role: z.enum(["brand", "creator"]) }));
  await setRole(user, role);
  return noContent();
});

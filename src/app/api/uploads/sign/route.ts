import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { signUpload } from "@/server/services/uploads";

const Body = z.object({
  kind: z.enum(["avatar", "logo", "post-screenshot"]),
  ext: z.enum(["jpg", "jpeg", "png", "webp"]),
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { kind, ext } = await parseBody(req, Body);
  return ok(await signUpload(user, kind, ext));
});

import { PostSubmissionInput } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { submitPost } from "@/server/services/posts";

export const POST = handler(async (req) => {
  const user = await requireRole("creator");
  return ok(await submitPost(user, await parseBody(req, PostSubmissionInput)), 201);
});

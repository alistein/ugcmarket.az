import { errors } from "@/server/http/errors";
import { handler, ok } from "@/server/http/handler";
import { getPublicCreator } from "@/server/services/creators";

/** Public creator profile (approved only, no contacts). */
export const GET = handler<{ handle: string }>(async (_req, { params }) => {
  const creator = await getPublicCreator((await params).handle);
  if (!creator) throw errors.notFound("creator");
  return ok(creator);
});

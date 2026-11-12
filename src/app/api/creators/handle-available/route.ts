import { z } from "zod";
import { CreatorHandle } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseQuery } from "@/server/http/handler";
import { isHandleAvailable } from "@/server/services/creators";

/** GET ?handle=… → { available }. Invalid/reserved handles are 422 (same message keys as the form). */
export const GET = handler(async (req) => {
  await requireRole("creator");
  const { handle } = parseQuery(req, z.object({ handle: CreatorHandle }));
  return ok({ handle, available: await isHandleAvailable(handle) });
});

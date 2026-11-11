import { z } from "zod";
import { Locale } from "@/schemas";
import { getUser, requireUser } from "@/server/auth";
import { handler, noContent, ok, parseBody } from "@/server/http/handler";
import { getMe, setLocale } from "@/server/services/me";

/** GET current user (null when signed out). */
export const GET = handler(async () => {
  const user = await getUser();
  return ok(user ? await getMe(user) : null);
});

export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const { locale } = await parseBody(req, z.object({ locale: Locale }));
  await setLocale(user, locale);
  return noContent();
});

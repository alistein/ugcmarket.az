import { z } from "zod";
import { EnabledNetwork, SocialUsername } from "@/schemas";
import { requireRole } from "@/server/auth";
import { handler, ok, parseBody } from "@/server/http/handler";
import { lookupSocial } from "@/server/services/social-stats";

/** "Connect account" in the profile form: fetch public numbers now (rate limited, paid). */
export const POST = handler(async (req) => {
  const { network, handle } = await parseBody(
    req,
    z.object({ network: EnabledNetwork, handle: SocialUsername }),
  );
  const user = await requireRole("creator");
  return ok(await lookupSocial(user, network, handle));
});

// Third-party providers can take up to ~2 minutes.
export const maxDuration = 120;

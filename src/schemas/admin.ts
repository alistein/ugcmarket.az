import { z } from "zod";

export const ModerationAction = z.object({
  action: z.enum(["approve", "reject", "block", "unblock"]),
  reason: z.string().max(500).optional(),
});

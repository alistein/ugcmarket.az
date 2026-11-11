import { z } from "zod";

export const ApplicationInput = z.object({
  message: z.string().max(500).optional(),
});

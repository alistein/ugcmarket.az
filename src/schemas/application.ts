import { z } from "zod";
import { blankToNull } from "./common";

export const ApplicationInput = z.object({
  message: z.string().max(500).optional(),
  /** The creator's price on a "bid" listing (required there, ignored elsewhere; the service checks). */
  bid_amount: z.preprocess(
    blankToNull,
    z.coerce
      .number({ error: "validation.number" })
      .positive("validation.amount")
      .max(1_000_000, "validation.number")
      .nullable()
      .optional(),
  ),
});
export type ApplicationInput = z.infer<typeof ApplicationInput>;

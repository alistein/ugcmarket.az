"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { DEAL_FORMATS } from "@/schemas";
import { dealOpen } from "../form";
import type { CreatorPublic } from "../hooks";

/** How a creator works with brands: Ödənişli, Barter, Kollaborasiya (any of them). */
export function DealTerms({
  creator: c,
}: {
  creator: Pick<CreatorPublic, "paid_open" | "barter_open" | "repost_open">;
}) {
  const t = useTranslations("taxonomy.dealFormats");
  return (
    <>
      {DEAL_FORMATS.filter((f) => dealOpen(c, f)).map((f) => (
        <Badge key={f} variant="secondary">
          {t(f)}
        </Badge>
      ))}
    </>
  );
}

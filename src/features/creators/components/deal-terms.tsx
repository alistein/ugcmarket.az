"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CreatorPublic } from "../hooks";

/** How a creator works: paid only, or paid plus barter and/or free for a repost. */
export function DealTerms({ creator: c }: { creator: Pick<CreatorPublic, "barter_open" | "repost_open"> }) {
  const t = useTranslations("taxonomy.terms");
  if (!c.barter_open && !c.repost_open) {
    return <Badge variant="secondary">{t("paidOnly")}</Badge>;
  }
  return (
    <>
      <Badge variant="secondary">{t("paid")}</Badge>
      {c.barter_open && <Badge variant="mint">{t("barter")}</Badge>}
      {c.repost_open && <Badge variant="mint">{t("repost")}</Badge>}
    </>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";

/**
 * Share a live listing's public link. Phones open the native share sheet, so a brand can drop it
 * straight into an Instagram story or DM; computers copy the link.
 */
export function useShareListing() {
  const t = useTranslations("listing");
  const locale = useLocale();

  return async (campaign: { id: string; title: string | null }) => {
    const url = `${window.location.origin}/${locale}/campaigns/${campaign.id}`;
    const result = await shareOrCopy({ title: campaign.title ?? undefined, url });
    if (result === "copied") toast.success(t("shareCopied"));
    else if (result === "failed") toast.error(t("shareFailed"));
  };
}

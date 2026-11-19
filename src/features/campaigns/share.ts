"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Share a live listing's public link. Phones (and Safari) open the native share sheet, so a brand
 * can drop it straight into an Instagram story or DM; elsewhere the link is copied.
 */
export function useShareListing() {
  const t = useTranslations("listing");
  const locale = useLocale();

  return async (campaign: { id: string; title: string | null }) => {
    const url = `${window.location.origin}/${locale}/campaigns/${campaign.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: campaign.title ?? undefined, url });
        return;
      } catch (e) {
        // Closing the sheet isn't an error; anything else falls back to copying.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("shareCopied"));
    } catch {
      toast.error(t("shareFailed"));
    }
  };
}

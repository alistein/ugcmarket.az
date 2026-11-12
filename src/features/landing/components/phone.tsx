"use client";

import { ArrowLeft01Icon, Share08Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Phone product shot (stageshow): ONE real-looking screen, not a stack of identical cards.
 * A campaign detail in an iOS grouped-list layout; the payoff ("Aysel applied") arrives as a
 * system notification banner straddling the phone's top edge. Demo content stays Azerbaijani
 * (it's a local board); UI labels follow the locale.
 */
export function BoardPhone() {
  const t = useTranslations("landing.board");
  const rows: [string, string][] = [
    [t("reward"), "150 AZN"],
    [t("format"), "Instagram Reels"],
    [t("deadline"), "30.11"],
    [t("creators"), t("creatorsValue")],
  ];
  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      <div className="rounded-[3.2rem] bg-[#1c1917] p-2.5 shadow-(--shadow-float) ring-1 ring-black/10 dark:ring-white/10">
        <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[2.7rem] bg-[color-mix(in_oklch,var(--background),var(--foreground)_2%)]">
          <div className="absolute top-3 left-1/2 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-[#1c1917]" />

          <div className="flex items-center justify-between px-5 pt-14 text-foreground">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" aria-label={t("back")} />
            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} className="size-5" />
          </div>

          <div className="flex-1 space-y-5 px-5 pt-5">
            <div className="space-y-1.5">
              <div className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">Decolive</span> · ev dekoru
              </div>
              <div className="font-heading text-[22px] leading-[1.15] font-semibold tracking-[-0.02em]">
                Yeni kolleksiya üçün ev interyeri Reels
              </div>
            </div>

            <div className="divide-y divide-border/70 rounded-2xl bg-card px-4 shadow-(--shadow-soft)">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5 text-[14px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium tabular-nums">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 px-1">
              <div className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">{t("brief")}</div>
              <p className="text-[14px] leading-snug">
                Kolleksiyadan bir məhsulu öz evinizdə göstərin. 15–30 saniyə, təbii işıqda.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 px-5 pb-7">
            <div className="text-center text-[12px] text-muted-foreground">{t("applications")}</div>
            <Button size="lg" className="w-full">
              {t("apply")}
            </Button>
          </div>
        </div>
      </div>

      {/* Payoff as an iOS notification banner, straddling the top edge (satellite). */}
      <div className="absolute top-14 -right-3 left-[-0.75rem] z-20 rounded-[1.6rem] bg-popover/85 px-4 py-3 shadow-(--shadow-float) ring-1 ring-foreground/5 backdrop-blur-xl backdrop-saturate-150 sm:-right-16 sm:left-12 dark:ring-white/10">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-semibold tracking-[0.08em] uppercase">UGCMarket</span>
          <span>{t("now")}</span>
        </div>
        <div className="mt-1 text-[14px] font-semibold">{t("notifTitle")}</div>
        <div className="text-[13px] text-muted-foreground tabular-nums">
          @aysel.mmd · 18 340 {t("followers")}
        </div>
      </div>
    </div>
  );
}

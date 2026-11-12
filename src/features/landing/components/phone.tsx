"use client";

import { Calendar03Icon, GiftIcon, InstagramIcon, Location01Icon, TiktokIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function MiniCampaign({
  brand,
  title,
  network,
  reward,
  barter,
  city,
  date,
}: {
  brand: string;
  title: string;
  network: "instagram" | "tiktok";
  reward: string;
  barter?: boolean;
  city: string;
  date: string;
}) {
  const t = useTranslations("landing.board");
  return (
    <div className="space-y-3 rounded-[1.4rem] bg-card p-4 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04]">
      <div className="flex items-center gap-2">
        <NamedAvatar name={brand} size="sm" />
        <span className="text-[13px] text-muted-foreground">{brand}</span>
      </div>
      <div className="text-[15px] leading-snug font-semibold tracking-[-0.01em]">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={network === "instagram" ? "sky" : "rose"}>
          <HugeiconsIcon icon={network === "instagram" ? InstagramIcon : TiktokIcon} strokeWidth={2} data-icon="inline-start" />
          {network === "instagram" ? "Reels" : "TikTok"}
        </Badge>
        <Badge variant={barter ? "sun" : "brand"}>
          {barter && <HugeiconsIcon icon={GiftIcon} strokeWidth={2} data-icon="inline-start" />}
          {reward}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
            {city}
          </span>
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
            {date}
          </span>
        </span>
        <Button size="xs">{t("apply")}</Button>
      </div>
    </div>
  );
}

/** Phone product shot: the board is the subject; the new application is the satellite on its edge (stageshow). */
export function BoardPhone() {
  const t = useTranslations("landing.board");
  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      <div className="rounded-[3.2rem] bg-[#1c1917] p-2.5 shadow-(--shadow-float) ring-1 ring-black/10 dark:ring-white/10">
        <div className="relative h-[600px] overflow-hidden rounded-[2.7rem] bg-background">
          <div className="absolute top-3 left-1/2 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-[#1c1917]" />
          <div className="space-y-3 px-4 pt-16">
            <div className="px-1 font-heading text-2xl font-semibold tracking-[-0.025em]">{t("label")}</div>
            <MiniCampaign brand="Decolive" title="Yeni kolleksiya üçün ev interyeri" network="instagram" reward={`150 AZN`} city="Bakı" date="30 noy" />
            <MiniCampaign brand="Şirin Kafe" title="Açılış həftəsi — 2 video" network="tiktok" reward={t("barter")} barter city="Gəncə" date="5 dek" />
            <MiniCampaign brand="Lumi Studio" title="Payız kolleksiyası, stories" network="instagram" reward="90 AZN" city="Bakı" date="12 dek" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
        </div>
      </div>
      {/* Satellite: straddles the phone's right edge */}
      <div className="absolute top-[45%] -right-4 w-[17.5rem] rounded-3xl bg-popover/90 p-3 shadow-(--shadow-float) ring-1 ring-foreground/5 backdrop-blur-xl sm:-right-28 dark:ring-white/10">
        <div className="flex items-center gap-3">
          <NamedAvatar name="Aysel Məmmədova" badge />
          <div className="min-w-0 flex-1">
            <div className="text-sm leading-tight font-semibold">{t("applied")}</div>
            <div className="truncate text-xs text-muted-foreground tabular-nums">18.4K · 9.1K avg</div>
          </div>
          <Button size="xs" variant="soft">
            {t("view")}
          </Button>
        </div>
      </div>
    </div>
  );
}

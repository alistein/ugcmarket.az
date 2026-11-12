"use client";

import {
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  FavouriteIcon,
  InstagramIcon,
  LockIcon,
  PlayIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const STEPS = ["about", "content", "socials", "prices"] as const;

/** /me before the creator profile exists: plain background, steps + a preview of the result. */
export function SetupPrompt() {
  const t = useTranslations("creator.dashboard");
  const ts = useTranslations("creator.steps");
  return (
    <div className="grid items-center gap-12 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:py-10">
      <div className="max-w-xl">
        <Badge variant="mint">{t("setupEyebrow")}</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          {t("setupTitle")}
        </h1>
        <p className="mt-3 text-lg text-pretty text-muted-foreground">{t("setupBody")}</p>

        <ol className="mt-8 grid gap-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-start gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background tabular-nums">
                {i + 1}
              </span>
              <span className="grid gap-0.5 pt-1">
                <span className="font-medium">{ts(`${s}.title`)}</span>
                <span className="text-sm text-muted-foreground">{ts(`${s}.subtitle`)}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-8 flex items-start gap-2.5 rounded-2xl bg-sun/60 px-4 py-3 text-sm text-sun-ink">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {t("applyRule")}
        </p>

        <Button
          size="lg"
          className="mt-8 h-12 px-6 text-base"
          nativeButton={false}
          render={<Link href="/me/profile" />}
        >
          {t("setupCta")}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </div>

      <SetupVisual />
    </div>
  );
}

/** Decorative: what a finished profile looks like. Static (seen once), aria-hidden. */
function SetupVisual() {
  const t = useTranslations("creator.dashboard.visual");
  return (
    <div aria-hidden className="relative mx-auto h-[26rem] w-full max-w-[26rem] select-none">
      {/* backdrop blobs */}
      <div className="absolute inset-x-6 top-6 bottom-10 rounded-[2.5rem] bg-muted" />
      <div className="absolute top-0 right-2 size-28 rounded-[2rem] bg-sun [background-image:radial-gradient(var(--sun-ink)_1px,transparent_1.2px)] [background-size:8px_8px] opacity-60" />
      <div className="absolute bottom-2 left-0 size-24 rounded-full bg-sky" />

      {/* profile card */}
      <div className="absolute top-14 left-1/2 w-[19rem] -translate-x-1/2 -rotate-2 rounded-3xl bg-card p-5 shadow-(--shadow-float)">
        <div className="flex items-center gap-3">
          <NamedAvatar name="Nigar Həsənova" className="size-14" fallbackClassName="text-lg" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-semibold tracking-[-0.02em]">
              Nigar Həsənova
              <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-4 text-mint-ink" />
            </p>
            <p className="text-sm text-muted-foreground">@nigar.creates · {t("city")}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="brand">{t("tag1")}</Badge>
          <Badge variant="brand">{t("tag2")}</Badge>
          <Badge variant="mint">{t("barter")}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["bg-rose", "bg-sun", "bg-mint"].map((tone) => (
            <div key={tone} className={`flex aspect-[3/4] items-center justify-center rounded-xl ${tone}`}>
              <span className="flex size-7 items-center justify-center rounded-full bg-white/70">
                <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5 translate-x-px" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* followers chip */}
      <div className="absolute top-4 left-0 rotate-[-6deg] rounded-2xl bg-card px-4 py-3 shadow-(--shadow-raised)">
        <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">24.6K</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} className="size-3.5" />
          {t("followers")}
        </p>
      </div>

      {/* price chip */}
      <div className="absolute right-0 bottom-20 rotate-[5deg] rounded-2xl bg-card px-4 py-3 shadow-(--shadow-raised)">
        <p className="text-xs text-muted-foreground">Reels</p>
        <p className="font-semibold tabular-nums">120 AZN</p>
      </div>

      {/* tiktok likes chip */}
      <div className="absolute bottom-6 left-16 flex rotate-[-3deg] items-center gap-2 rounded-full bg-foreground px-3.5 py-2 text-sm text-background shadow-(--shadow-raised)">
        <HugeiconsIcon icon={TiktokIcon} strokeWidth={2} className="size-4" />
        <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-4" />
        <span className="tabular-nums">3.1K</span>
      </div>
    </div>
  );
}

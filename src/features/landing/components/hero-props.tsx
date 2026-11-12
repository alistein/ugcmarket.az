"use client";

import {
  CheckmarkCircle02Icon,
  FavouriteIcon,
  InstagramIcon,
  PlayIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Tactile objects scattered around the hero (heyclicky / envite pattern), UGC-flavored.
 * Static on purpose; they enter once with the hero stagger (Emil: 300ms, 8px, 50ms steps).
 * Rotation lives on an inner element so the entrance transform doesn't fight it.
 */
function Prop({ className, delay, rotate, children }: { className: string; delay: number; rotate: string; children: React.ReactNode }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute animate-enter select-none", className)} style={{ animationDelay: `${delay}ms` }}>
      <div style={{ rotate }}>{children}</div>
    </div>
  );
}

export function HeroProps() {
  const t = useTranslations("landing.props");
  return (
    <>
      {/* Creator name tag */}
      <Prop className="top-6 left-[2%] hidden md:block" delay={150} rotate="-8deg">
        <div className="w-44 overflow-hidden rounded-2xl bg-card shadow-(--shadow-raised) ring-1 ring-foreground/5">
          <div className="bg-primary px-4 pt-2.5 pb-2 text-center text-primary-foreground">
            <div className="text-[13px] font-bold tracking-[0.12em] uppercase">{t("hello")}</div>
          </div>
          <div className="px-4 py-3 text-center font-heading text-xl font-semibold tracking-[-0.02em] italic">@aysel</div>
        </div>
      </Prop>

      {/* Sticky note */}
      <Prop className="top-14 right-[6%] hidden md:block" delay={200} rotate="6deg">
        <div className="flex size-32 flex-col justify-between bg-sun p-3.5 text-sun-ink shadow-(--shadow-raised)">
          <span className="text-[15px] leading-snug font-semibold">{t("barter")}</span>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
        </div>
      </Prop>

      {/* Reels polaroid */}
      <Prop className="top-[46%] left-[-1%] hidden lg:block" delay={250} rotate="5deg">
        <div className="w-40 rounded-md bg-card p-2.5 pb-3 shadow-(--shadow-raised)">
          <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(160deg,var(--sun),var(--brand-soft)_55%,var(--rose))]">
            <span className="flex size-10 items-center justify-center rounded-full bg-white/80 text-foreground shadow-(--shadow-soft) backdrop-blur">
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4 translate-x-px" />
            </span>
            <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} className="absolute top-2 right-2 size-4 text-white" />
          </div>
          <div className="pt-2 text-center text-xs text-muted-foreground">{t("reels")}</div>
        </div>
      </Prop>

      {/* Views counter */}
      <Prop className="top-[40%] right-[1%] hidden md:block" delay={300} rotate="-4deg">
        <div className="flex items-center gap-2 rounded-full bg-foreground py-2 pr-4 pl-2 text-background shadow-(--shadow-float)">
          <span className="flex size-7 items-center justify-center rounded-full bg-background/15">
            <HugeiconsIcon icon={TiktokIcon} strokeWidth={2} className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tabular-nums">48.2K</span>
          <span className="text-xs opacity-70">{t("views")}</span>
        </div>
      </Prop>

      {/* Payment ticket */}
      <Prop className="bottom-2 right-[9%] hidden lg:block" delay={350} rotate="-7deg">
        <div className="relative flex w-44 flex-col items-center rounded-xl bg-sky px-4 py-3 text-sky-ink shadow-(--shadow-raised)">
          <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">{t("paid")}</span>
          <span className="font-heading text-2xl font-semibold tracking-[-0.02em] tabular-nums">150 AZN</span>
        </div>
      </Prop>

      {/* Like bubble */}
      <Prop className="bottom-10 left-[10%] hidden md:block" delay={400} rotate="-10deg">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose text-rose-ink shadow-(--shadow-raised)">
          <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-6" />
        </div>
      </Prop>
    </>
  );
}

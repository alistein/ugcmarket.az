"use client";

import { CheckmarkCircle02Icon, Comment01Icon, FavouriteIcon, TiktokIcon } from "@hugeicons/core-free-icons";
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
          <div className="px-4 py-3 text-center font-heading text-xl font-semibold tracking-[-0.02em] italic">@aysel.mmd</div>
        </div>
      </Prop>

      {/* Sticky note */}
      <Prop className="top-14 right-[6%] hidden md:block" delay={200} rotate="6deg">
        <div className="flex size-32 flex-col justify-between bg-sun p-3.5 text-sun-ink shadow-(--shadow-raised)">
          <span className="text-[15px] leading-snug font-semibold">{t("barter")}</span>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
        </div>
      </Prop>

      {/* Reels frame — recognizable UI, not a gradient blob */}
      <Prop className="top-[40%] left-[-1%] hidden lg:block" delay={250} rotate="5deg">
        <div className="relative flex h-64 w-36 flex-col justify-end overflow-hidden rounded-[1.4rem] bg-[#26211d] p-3 text-white shadow-(--shadow-float)">
          <div className="absolute inset-x-6 top-10 h-24 rounded-[45%_45%_12px_12px] bg-[#8a6f5a]/60" />
          <div className="absolute inset-x-4 top-[7.5rem] h-10 rounded-lg bg-[#6b5546]/70" />
          <span className="absolute top-3 left-3 text-[11px] font-semibold">Reels</span>
          <div className="absolute right-2.5 bottom-14 flex flex-col items-center gap-2.5 text-[10px] font-medium">
            <span className="flex flex-col items-center">
              <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-4" />
              1 204
            </span>
            <span className="flex flex-col items-center">
              <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-4" />
              87
            </span>
          </div>
          <div className="relative space-y-0.5 pr-7">
            <div className="text-[11px] font-semibold">@aysel.mmd</div>
            <div className="text-[11px] leading-tight opacity-90">{t("caption")}</div>
          </div>
          <div className="relative mt-2.5 h-0.5 rounded-full bg-white/25">
            <div className="h-full w-2/5 rounded-full bg-white" />
          </div>
        </div>
      </Prop>

      {/* Views counter */}
      <Prop className="top-[40%] right-[1%] hidden md:block" delay={300} rotate="-4deg">
        <div className="flex items-center gap-2 rounded-full bg-foreground py-2 pr-4 pl-2 text-background shadow-(--shadow-float)">
          <span className="flex size-7 items-center justify-center rounded-full bg-background/15">
            <HugeiconsIcon icon={TiktokIcon} strokeWidth={2} className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tabular-nums">48 213</span>
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

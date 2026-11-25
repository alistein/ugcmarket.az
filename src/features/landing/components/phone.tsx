"use client";

import { ArrowLeft01Icon, Share08Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IPhone } from "./iphone";

/** Fires once when the element scrolls into view (Emil: reveal once, never re-animate on scroll-by). */
function useInViewOnce<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/**
 * iMessage-style bubble. Pops from its tail corner (origin-aware), scale 0.9 + opacity → 1,
 * 300ms --ease-out transition (Emil). Reduced motion keeps only the fade (globals.css).
 */
function Bubble({
  side,
  shown,
  delay,
  from,
  children,
  className,
}: {
  side: "sent" | "received";
  shown: boolean;
  delay: number;
  from: string;
  children: React.ReactNode;
  className?: string;
}) {
  const sent = side === "sent";
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-30 flex-col gap-1 [transition:opacity_300ms_var(--ease-out),scale_300ms_var(--ease-out)]",
        sent ? "items-end origin-bottom-right" : "items-start origin-bottom-left",
        !className?.includes("hidden") && "flex",
        shown ? "scale-100 opacity-100" : "scale-90 opacity-0",
        className
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      <div
        className={cn(
          "max-w-[15rem] rounded-[1.3rem] px-4 py-2.5 text-[16px] leading-snug shadow-(--shadow-raised) sm:text-[17px]",
          sent ? "rounded-br-[0.4rem] bg-[#0a84ff] text-white" : "rounded-bl-[0.4rem] bg-[#e9e9eb] text-[#111] dark:bg-[#3a3a3c] dark:text-white"
        )}
      >
        {children}
      </div>
      <span className="px-2 text-xs text-muted-foreground">{from}</span>
    </div>
  );
}

/** Campaign screen inside a 1:1 iPhone, with the offer → accept conversation popping in beside it. */
export function BoardPhone() {
  const t = useTranslations("landing.board");
  const [ref, shown] = useInViewOnce<HTMLDivElement>();
  const rows: [string, string][] = [
    [t("reward"), "150 AZN"],
    [t("format"), "Instagram Reels"],
    [t("deadline"), "30.11"],
    [t("creators"), t("creatorsValue")],
  ];
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-4xl">
      {/* Desktop: bubbles straddle the frame's sides (envite). */}
      <Bubble side="sent" shown={shown} delay={150} from="Decoliv" className="hidden md:flex md:top-[16%] md:left-[calc(50%+150px)]">
        {t("offer")}
      </Bubble>
      <Bubble side="received" shown={shown} delay={850} from="@aysel.mmd" className="hidden md:flex md:right-[calc(50%+150px)] md:bottom-[26%]">
        {t("accept")}
      </Bubble>

      {/* Phone widths: offer above the top-right corner, reply below the bottom-left — content stays readable. */}
      <div className="relative z-30 -mb-7 flex justify-end pr-1 md:hidden">
        <Bubble side="sent" shown={shown} delay={150} from="Decoliv" className="relative">
          {t("offer")}
        </Bubble>
      </div>
      <IPhone>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 pt-[58px] text-foreground">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" aria-label={t("back")} />
            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} className="size-5" />
          </div>

          <div className="flex-1 space-y-5 px-5 pt-4">
            <div className="space-y-1.5">
              <div className="text-[13px] text-muted-foreground">
                <span className="font-semibold text-foreground">Decoliv</span> · ev dekoru
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
              <p className="text-[14px] leading-snug">Kolleksiyadan bir məhsulu öz evinizdə göstərin. 15–30 saniyə, təbii işıqda</p>
            </div>
          </div>

          <div className="space-y-2.5 px-5 pb-9">
            <div className="text-center text-[12px] text-muted-foreground">{t("applications")}</div>
            <Button size="lg" className="w-full">
              {t("apply")}
            </Button>
          </div>
        </div>
      </IPhone>
      <div className="relative z-30 -mt-9 flex justify-start pl-1 md:hidden">
        <Bubble side="received" shown={shown} delay={850} from="@aysel.mmd" className="relative">
          {t("accept")}
        </Bubble>
      </div>
    </div>
  );
}

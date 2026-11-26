"use client";

import { InstagramIcon, Tick02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const SWAP_MS = 2400;
const SLOW_MS = 20_000;
const CARDS = 3;

/**
 * Full-screen wait after "Profili yarat" while the server looks up the Instagram numbers.
 * Three sample cards swap places with a title for each. The server sends no progress, so
 * nothing here claims a real step: the bar creeps toward 90% and fills only when `done`.
 * Motion (Emil Kowalski): seen once per account, so a slower 600ms swap is fine; slots are
 * CSS transitions on transform props (interruptible), reduced motion crossfades in place.
 */
export function SetupWaiting({ done }: { done: boolean }) {
  const t = useTranslations("creator.setup.waiting");
  const [active, setActive] = useState(0);
  const [slow, setSlow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.focus();
    const id = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(id);
  }, []);

  // Swap every 2.4s; pause while the tab is hidden, stop once done.
  useEffect(() => {
    if (done) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(id);
      if (!document.hidden) id = setInterval(() => setActive((a) => (a + 1) % CARDS), SWAP_MS);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", start);
    };
  }, [done]);

  const titles = [t("title1"), t("title2"), t("title3"), t("done")];
  const shownTitle = done ? 3 : active;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background outline-none [transition:opacity_200ms_var(--ease-out)] starting:opacity-0"
    >
      {/* Progress: creeps toward 90% (fast, then slower), fills on done. */}
      <div className="h-1 w-full bg-muted" aria-hidden>
        <div
          className={cn(
            "h-full origin-left rounded-r-full bg-primary",
            done
              ? "scale-x-100 [transition:scale_300ms_var(--ease-out)]"
              : "scale-x-[0.9] [transition:scale_20s_cubic-bezier(0.1,0.6,0.3,1)] starting:scale-x-0",
          )}
        />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-10 px-4 py-8 sm:gap-14">
        <div className="grid w-full text-center" role="status" aria-live="polite">
          {titles.map((title, i) => (
            <h1
              key={i}
              aria-hidden={i !== shownTitle}
              className={cn(
                "text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance [grid-area:1/1] sm:text-4xl",
                i === shownTitle
                  ? "translate-y-0 opacity-100 [transition:opacity_250ms_var(--ease-out),translate_250ms_var(--ease-out)]"
                  : "translate-y-1.5 opacity-0 [transition:opacity_150ms_var(--ease-out),translate_0ms_150ms]",
              )}
            >
              {title}
            </h1>
          ))}
          <p
            className={cn(
              "mt-3 text-sm text-pretty text-muted-foreground [transition:opacity_250ms_var(--ease-out)]",
              slow && !done ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!slow || done}
          >
            {t("slow")}
          </p>
        </div>

        <CardStack active={active} done={done} />

        <Logo markOnly className="text-2xl text-foreground/80" />
      </div>
    </div>
  );
}

// Slot = card offset from the front: 0 front, 1 back-right, 2 back-left.
const SLOT = [
  "z-20 translate-x-0 rotate-0 scale-100 opacity-100 shadow-float",
  "z-10 translate-x-[58%] rotate-6 scale-[0.88] opacity-100 shadow-soft motion-reduce:translate-x-0 motion-reduce:rotate-0 motion-reduce:scale-100 motion-reduce:opacity-0",
  "z-10 -translate-x-[58%] -rotate-6 scale-[0.88] opacity-100 shadow-soft motion-reduce:translate-x-0 motion-reduce:rotate-0 motion-reduce:scale-100 motion-reduce:opacity-0",
];
const ENTER_DELAY = ["delay-0", "delay-[60ms]", "delay-[120ms]"];

function CardStack({ active, done }: { active: number; done: boolean }) {
  const cards = [<AccountCard key="a" />, <StatsCard key="s" />, <ProfileCard key="p" />];
  return (
    <div className="relative grid h-[min(34vh,20rem)] min-h-52 w-full place-items-center" aria-hidden>
      {cards.map((card, i) => {
        const slot = (i - active + CARDS) % CARDS;
        return (
          <div
            key={i}
            className={cn(
              "absolute aspect-[3/4] h-full max-w-[62%] overflow-hidden rounded-3xl bg-card",
              "[transition:translate_600ms_var(--ease-in-out),rotate_600ms_var(--ease-in-out),scale_600ms_var(--ease-in-out),opacity_600ms_var(--ease-in-out)]",
              "starting:translate-y-3 starting:opacity-0",
              ENTER_DELAY[i],
              SLOT[slot],
            )}
          >
            {card}
            {slot === 0 && (
              <span
                className={cn(
                  "absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-mint text-mint-ink",
                  "[transition:opacity_200ms_var(--ease-out),scale_200ms_var(--ease-out)]",
                  done ? "scale-100 opacity-100" : "scale-95 opacity-0",
                )}
              >
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-4" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sample widgets: the same for everyone, no numbers that could pass as the creator's ──
function Bar({ className }: { className?: string }) {
  return <span className={cn("block h-2.5 rounded-full bg-muted", className)} />;
}

function AccountCard() {
  const t = useTranslations("creator.setup.waiting");
  const tiles = ["bg-brand-soft", "bg-sun", "bg-sky", "bg-rose", "bg-mint", "bg-brand-soft"];
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sun via-rose to-primary p-0.5">
          <span className="flex size-full items-center justify-center rounded-full bg-card text-muted-foreground">
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-5" />
          </span>
        </span>
        <span className="grid min-w-0 flex-1 gap-1.5">
          <Bar className="w-3/4 bg-foreground/15" />
          <Bar className="w-1/2" />
        </span>
        <HugeiconsIcon
          icon={InstagramIcon}
          strokeWidth={2}
          className="size-5 shrink-0 text-muted-foreground"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[t("followers"), t("posts"), t("views")].map((label) => (
          <span key={label} className="grid justify-items-center gap-1.5">
            <Bar className="w-8 bg-foreground/15" />
            <span className="w-full truncate text-xs text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-3 gap-1">
        {tiles.map((c, i) => (
          <span key={i} className={cn("rounded-md", c)} />
        ))}
      </div>
    </div>
  );
}

function StatsCard() {
  const t = useTranslations("creator.setup.waiting");
  const bars = [38, 56, 44, 72, 60, 88, 66];
  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">{t("views")}</span>
        <Bar className="h-4 w-1/2 bg-foreground/15" />
      </div>
      <div className="flex flex-1 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-t-md", i === bars.length - 2 ? "bg-primary/70" : "bg-primary/20")}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[t("er"), t("likes")].map((label) => (
          <span key={label} className="grid gap-1.5">
            <span className="truncate text-xs text-muted-foreground">{label}</span>
            <Bar className="w-2/3 bg-foreground/15" />
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileCard() {
  const tt = useTranslations("taxonomy.categories");
  return (
    <div className="flex h-full flex-col items-center gap-3 p-4 text-center sm:p-5">
      <span className="mt-2 flex size-16 items-center justify-center rounded-full bg-sky text-sky-ink">
        <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-7" />
      </span>
      <Bar className="h-3 w-2/3 bg-foreground/15" />
      <Bar className="w-1/3" />
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {(["beauty", "lifestyle"] as const).map((c) => (
          <span key={c} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {tt(c)}
          </span>
        ))}
      </div>
      <div className="mt-auto grid w-full grid-cols-3 gap-1">
        {["bg-rose", "bg-sun", "bg-mint"].map((c) => (
          <span key={c} className={cn("aspect-[9/14] rounded-md", c)} />
        ))}
      </div>
    </div>
  );
}

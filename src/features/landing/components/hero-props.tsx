"use client";

import { CheckmarkCircle02Icon, Comment01Icon, FavouriteIcon, TiktokIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Tactile UGC objects around the hero (heyclicky / envite pattern).
 * Motion strictly per Emil Kowalski: purposeful (explains a live marketplace), transitions not
 * keyframes, transform/opacity/filter only, timers pause when the tab is hidden, reduced motion
 * stops movement. Rotation lives on an inner element so the entrance transform doesn't fight it.
 */
function Prop({ className, delay, rotate, children }: { className: string; delay: number; rotate: string; children: React.ReactNode }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute animate-enter select-none", className)} style={{ animationDelay: `${delay}ms` }}>
      <div style={{ rotate }}>{children}</div>
    </div>
  );
}

/** Runs `tick` every `ms` while the tab is visible (Sonner principle: pause timers when hidden). */
function useTicker(tick: () => void, ms: number, enabled = true) {
  const saved = useRef(tick);
  useEffect(() => {
    saved.current = tick;
  }, [tick]);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

// ── Name tag: 20 creators, women and men alternating ─────────────────────────
const HANDLES = [
  "aysel", "akif", "gunel", "rashad", "nigar", "tural", "leyla", "elvin", "aynur", "orxan",
  "sabina", "kanan", "narmin", "murad", "lala", "farid", "konul", "ceyhun", "fidan", "nihad",
];

function NameTag() {
  const t = useTranslations("landing.props");
  const [i, setI] = useState(0);
  useTicker(() => setI((v) => (v + 1) % HANDLES.length), 1800);
  return (
    <div className="w-48 overflow-hidden rounded-2xl bg-card shadow-(--shadow-raised) ring-1 ring-foreground/5">
      <div className="bg-primary px-4 pt-2.5 pb-2 text-center text-primary-foreground">
        <div className="text-[13px] font-bold tracking-[0.12em] uppercase">{t("hello")}</div>
      </div>
      <div className="px-4 py-3 text-center font-heading text-xl font-semibold tracking-[-0.02em] italic">
        {/* Content swap: Emil's blur mask (2px, 200ms ease) + a short settle on --ease-out, via @starting-style. */}
        <span
          key={HANDLES[i]}
          className="inline-block [transition:opacity_200ms_ease,filter_200ms_ease,translate_200ms_var(--ease-out)] starting:translate-y-1.5 starting:opacity-0 starting:blur-[2px]"
        >
          @{HANDLES[i]}
        </span>
      </div>
    </div>
  );
}

// ── TikTok views: climbs steadily, digits roll like an odometer ──────────────
const group = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const DIGIT_H = 1.25; // rem — one line of text-sm

/**
 * One rolling digit. Only digits that change move (stageshow: "a rolling amount rolls only the digits").
 * The column holds 0–9 twice so 9 → 0 keeps rolling forward instead of spinning back, then snaps.
 * Motion (Emil): transform only, 300ms --ease-in-out (movement on screen), transition = interruptible.
 */
function Digit({ d }: { d: number }) {
  const [pos, setPos] = useState(d);
  const [animate, setAnimate] = useState(true);
  const prev = useRef(d);

  useEffect(() => {
    if (d === prev.current) return;
    setAnimate(true);
    setPos(d < prev.current ? d + 10 : d); // wrapped past 9 → continue into the second 0–9 run
    prev.current = d;
  }, [d]);

  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  return (
    <span className="relative inline-block h-5 w-[1ch] overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 flex flex-col"
        onTransitionEnd={() => {
          if (pos >= 10) {
            setAnimate(false);
            setPos(pos - 10);
          }
        }}
        style={{
          transform: `translateY(${-pos * DIGIT_H}rem)`,
          transition: animate ? "transform 300ms var(--ease-in-out)" : "none",
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className="h-5 leading-5">
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingNumber({ value }: { value: number }) {
  const chars = group(value).split("");
  return (
    <span className="inline-flex text-sm leading-5 font-semibold tabular-nums" aria-label={group(value)}>
      {chars.map((c, i) =>
        // Key from the right so each digit keeps its place when the number grows a digit.
        /\d/.test(c) ? <Digit key={chars.length - i} d={Number(c)} /> : <span key={"s" + (chars.length - i)} className="w-[0.3em]" />
      )}
    </span>
  );
}

function ViewsCounter() {
  const t = useTranslations("landing.props");
  const [views, setViews] = useState(48213);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const step = () => {
      id = setTimeout(() => {
        if (document.visibilityState === "visible") setViews((v) => v + 3 + Math.floor(Math.random() * 17));
        step();
      }, 1000 + Math.random() * 500);
    };
    step();
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="flex items-center gap-2 rounded-full bg-foreground py-2 pr-4 pl-2 text-background shadow-(--shadow-float)">
      <span className="flex size-7 items-center justify-center rounded-full bg-background/15">
        <HugeiconsIcon icon={TiktokIcon} strokeWidth={2} className="size-3.5" />
      </span>
      <RollingNumber value={views} />
      <span className="text-xs opacity-70">{t("views")}</span>
    </div>
  );
}

// ── Reels: a tiny feed that swipes up on its own ─────────────────────────────
type Reel = { handle: string; caption: "reels1" | "reels2" | "reels3"; likes: string; comments: string; bg: string; scene: React.ReactNode };

const REELS: Reel[] = [
  {
    handle: "@aysel",
    caption: "reels1",
    likes: "1 204",
    comments: "87",
    bg: "#26211d",
    scene: (
      <>
        <div className="absolute inset-x-6 top-10 h-24 rounded-[45%_45%_12px_12px] bg-[#8a6f5a]/60" />
        <div className="absolute inset-x-4 top-[7.5rem] h-10 rounded-lg bg-[#6b5546]/70" />
      </>
    ),
  },
  {
    handle: "@gunel",
    caption: "reels2",
    likes: "862",
    comments: "41",
    bg: "#2a1e16",
    scene: (
      <>
        <div className="absolute top-14 left-1/2 h-16 w-20 -translate-x-1/2 rounded-b-[2.5rem] rounded-t-md bg-[#d9c7b0]/80" />
        <div className="absolute top-[7.6rem] left-1/2 h-3 w-28 -translate-x-1/2 rounded-full bg-[#b9a48b]/60" />
        <div className="absolute top-[4.7rem] left-[calc(50%+2.4rem)] size-6 rounded-full border-4 border-[#d9c7b0]/80" />
      </>
    ),
  },
  {
    handle: "@akif",
    caption: "reels3",
    likes: "2 318",
    comments: "154",
    bg: "#1d222c",
    scene: (
      <>
        <div className="absolute top-8 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white/40" />
        <div className="absolute top-12 left-1/2 h-28 w-24 -translate-x-1/2 rounded-t-[1.2rem] bg-[#7c5a43]/80 [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
      </>
    ),
  },
];

const REEL_MS = 3200;

function ReelsFeed() {
  const t = useTranslations("landing.props");
  const reduce = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [animate, setAnimate] = useState(true);
  const slides = [...REELS, REELS[0]]; // clone of the first: the loop always moves forward, never rewinds

  useTicker(() => {
    setAnimate(true);
    setIdx((v) => v + 1);
  }, REEL_MS, !reduce);

  // Landed on the clone → snap (without transition) to the real first slide.
  const onEnd = () => {
    if (idx === REELS.length) {
      setAnimate(false);
      setIdx(0);
    }
  };

  const active = idx % REELS.length;
  return (
    <div className="relative h-64 w-36 overflow-hidden rounded-[1.4rem] bg-[#1c1917] text-white shadow-(--shadow-float)">
      <div
        className="flex h-full flex-col"
        onTransitionEnd={onEnd}
        style={{
          transform: `translateY(${-idx * 100}%)`,
          // Moving on screen → Emil's ease-in-out; a swipe-length duration for an explanatory loop.
          transition: animate ? "transform 450ms var(--ease-in-out)" : "none",
        }}
      >
        {slides.map((r, i) => (
          <div key={i} className="relative h-full shrink-0 p-3" style={{ background: r.bg }}>
            {r.scene}
            <div className="absolute right-2.5 bottom-14 flex flex-col items-center gap-2.5 text-[10px] font-medium">
              <span className="flex flex-col items-center">
                <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-4" />
                {r.likes}
              </span>
              <span className="flex flex-col items-center">
                <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-4" />
                {r.comments}
              </span>
            </div>
            <div className="absolute inset-x-3 bottom-5 space-y-0.5 pr-7">
              <div className="text-[11px] font-semibold">{r.handle}</div>
              <div className="text-[11px] leading-tight opacity-90">{t(r.caption)}</div>
            </div>
          </div>
        ))}
      </div>
      <span className="absolute top-3 left-3 text-[11px] font-semibold">Reels</span>
      {/* Progress to the next swipe: constant motion → linear, on transform (scale) only. */}
      <div className="absolute inset-x-3 bottom-2.5 h-0.5 overflow-hidden rounded-full bg-white/25">
        <div
          key={reduce ? "static" : active + "-" + idx}
          className={cn(
            "h-full origin-left rounded-full bg-white",
            reduce ? "scale-x-40" : "scale-x-100 [transition:scale_3200ms_linear] starting:scale-x-0"
          )}
        />
      </div>
    </div>
  );
}

export function HeroProps() {
  const t = useTranslations("landing.props");
  return (
    <>
      <Prop className="top-6 left-[2%] hidden md:block" delay={150} rotate="-8deg">
        <NameTag />
      </Prop>

      <Prop className="top-14 right-[6%] hidden md:block" delay={200} rotate="6deg">
        <div className="flex size-32 flex-col justify-between bg-sun p-3.5 text-sun-ink shadow-(--shadow-raised)">
          <span className="text-[15px] leading-snug font-semibold">{t("barter")}</span>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5" />
        </div>
      </Prop>

      <Prop className="top-[40%] left-[-1%] hidden lg:block" delay={250} rotate="5deg">
        <ReelsFeed />
      </Prop>

      <Prop className="top-[40%] right-[1%] hidden md:block" delay={300} rotate="-4deg">
        <ViewsCounter />
      </Prop>

      <Prop className="bottom-20 right-[9%] hidden lg:block" delay={350} rotate="-7deg">
        <div className="relative flex w-44 flex-col items-center rounded-xl bg-sky px-4 py-3 text-sky-ink shadow-(--shadow-raised)">
          <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-background" />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase opacity-80">{t("paid")}</span>
          <span className="font-heading text-2xl font-semibold tracking-[-0.02em] tabular-nums">150 AZN</span>
        </div>
      </Prop>

      <Prop className="bottom-10 left-[10%] hidden md:block" delay={400} rotate="-10deg">
        <div className="flex size-14 items-center justify-center rounded-full bg-rose text-rose-ink shadow-(--shadow-raised)">
          <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-6" />
        </div>
      </Prop>
    </>
  );
}

/**
 * Phone-size version (envite pattern): two core stickers above the headline — the live name tag
 * on the left, the auto-scrolling Reels card on the right. Scaled with transform only; below md only.
 */
export function HeroPropsMobile() {
  return (
    <div aria-hidden className="pointer-events-none relative mx-auto mb-4 h-[12rem] w-full max-w-[24rem] select-none md:hidden">
      <MobileProp className="top-5 left-0" origin="origin-top-left" scale={0.8} rotate="-6deg" delay={100}>
        <NameTag />
      </MobileProp>
      <MobileProp className="top-0 right-1" origin="origin-top-right" scale={0.68} rotate="5deg" delay={160}>
        <ReelsFeed />
      </MobileProp>
    </div>
  );
}

function MobileProp({
  className,
  origin = "origin-center",
  scale,
  rotate,
  delay,
  children,
}: {
  className: string;
  origin?: string;
  scale: number;
  rotate: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("absolute animate-enter", className)} style={{ animationDelay: `${delay}ms` }}>
      <div className={origin} style={{ scale: String(scale), rotate }}>
        {children}
      </div>
    </div>
  );
}

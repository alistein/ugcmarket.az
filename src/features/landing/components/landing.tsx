"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Link01Icon,
  SentIcon,
  Store01Icon,
  UserCircleIcon,
  Video01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ActivityWall } from "./activity-wall";
import { HeroProps, HeroPropsMobile } from "./hero-props";
import { BoardPhone } from "./phone";
import { AppWindow } from "./window";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-card px-3 text-xs font-medium text-muted-foreground shadow-(--shadow-soft) ring-1 ring-foreground/[0.05]">
      {children}
    </span>
  );
}

function CtaButtons({ className }: { className?: string }) {
  const t = useTranslations("landing.hero");
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <Button size="lg" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "brand" } }} />}>
        {t("ctaBrand")}
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
      </Button>
      <Button size="lg" variant="outline" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "creator" } }} />}>
        {t("ctaCreator")}
      </Button>
    </div>
  );
}

function Nav() {
  const t = useTranslations("landing.nav");
  return (
    <header className="sticky top-0 z-40 bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,black_calc(100%-8px),transparent)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 py-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
        <Link href="/" className="font-heading text-lg font-semibold tracking-[-0.03em]">
          ugc<span className="text-primary">market</span>
        </Link>
        <nav className="ml-8 hidden gap-1 md:flex">
          {(["how", "brands", "creators", "faq"] as const).map((k) => (
            <a key={k} href={`#${k}`} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              {t(k)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" nativeButton={false} render={<Link href="/login" />}>
            {t("login")}
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
            {t("start")}
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const t = useTranslations("landing.hero");
  // Stagger (Emil): one shared step so the headline reads as a single gesture, ~60ms per word.
  const STEP = 60;
  const words = [
    ...t("titleA").split(" ").map((w) => ({ w, accent: false, br: false })),
    ...t("titleAccent").split(" ").map((w) => ({ w, accent: true, br: false })),
    ...t("titleB").split(" ").map((w, i) => ({ w, accent: false, br: i === 0 })),
  ];
  const at = (i: number) => ({ animationDelay: `${i * STEP}ms` });
  const after = words.length + 2; // slots used by eyebrow, brand ask and the words
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-6 pb-16 sm:pt-24 sm:pb-32">
      <HeroProps />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <HeroPropsMobile />
        <div className="animate-rise" style={at(0)}>
          <Pill>{t("eyebrow")}</Pill>
        </div>
        <h1 className="mt-6 font-heading text-[clamp(3.25rem,13vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.045em]">
          <span className="mb-3 block animate-rise text-[0.3em] leading-snug font-medium tracking-normal text-muted-foreground" style={at(1)}>
            {t("brandAsk")}
          </span>
          {words.map(({ w, accent, br }, i) => (
            <React.Fragment key={i}>
              {br ? <br /> : i > 0 ? " " : null}
              <span className={cn("inline-block animate-rise", accent && "text-primary")} style={at(i + 2)}>
                {w}
              </span>
            </React.Fragment>
          ))}
          <span className="mt-6 block animate-rise text-[0.3em] leading-snug font-medium tracking-normal text-muted-foreground" style={at(after)}>
            <span className="text-foreground">{t("creatorAsk")}</span> {t("creatorLine")}
          </span>
        </h1>
        <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-muted-foreground" style={at(after + 1)}>
          {t("sub")}
        </p>
        <div className="mt-8 animate-rise" style={at(after + 2)}>
          <CtaButtons />
          <p className="mt-3 text-xs text-muted-foreground">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}

/** Partner logos (public/partners/, transparent PNG, 160px tall). Add a partner = add a row here. */
/** `size` balances logos optically: wide wordmarks sit lower than compact marks. */
const PARTNERS: { name: string; src: string; srcDark?: string; width: number; height: number; size?: string }[] = [
  { name: "Decoliv", src: "/partners/decoliv.png", width: 743, height: 160 },
  { name: "bir-yer", src: "/partners/bir-yer.png", srcDark: "/partners/bir-yer-dark.png", width: 601, height: 160 },
  { name: "Rossmann", src: "/partners/rossmann.png", width: 1099, height: 160, size: "h-6 sm:h-7" },
];

function Partner() {
  const t = useTranslations("landing.partner");
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="flex flex-col items-center gap-6 border-y border-border/70 py-10 md:flex-row md:justify-center md:gap-10">
        <span className="text-sm text-muted-foreground">{t("label")}</span>
        <span aria-hidden className="hidden h-6 w-px bg-border md:block" />
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PARTNERS.map((p) => (
            <span key={p.name} className="flex items-center">
              <Image src={p.src} alt={p.name} width={p.width} height={p.height} className={cn("w-auto", p.size ?? "h-9 sm:h-10", p.srcDark && "dark:hidden")} />
              {/* Dark-mode variant for logos with dark wordmarks. */}
              {p.srcDark && <Image src={p.srcDark} alt={p.name} width={p.width} height={p.height} className={cn("hidden w-auto dark:block", p.size ?? "h-9 sm:h-10")} />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Board() {
  const t = useTranslations("landing.board");
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-14 space-y-4 text-center">
        <Pill>{t("label")}</Pill>
        <h2 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto max-w-sm text-lg text-muted-foreground">{t("sub")}</p>
      </div>
      <BoardPhone />
    </section>
  );
}

function Audience() {
  const t = useTranslations("landing.audience");
  const cards = [
    { id: "brands", label: t("brandsLabel"), title: t("brandsTitle"), points: [t("brands1"), t("brands2"), t("brands3")], link: "ugcmarket.az/c/decoliv-reels" },
    { id: "creators", label: t("creatorsLabel"), title: t("creatorsTitle"), points: [t("creators1"), t("creators2"), t("creators3")], link: "ugcmarket.az/creator/aysel.mmd" },
  ];
  return (
    <section id="brands" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
      <div className="mb-12 space-y-4 text-center">
        <Pill>{t("label")}</Pill>
        <h2 className="font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.id} id={c.id === "creators" ? "creators" : undefined} className="flex flex-col rounded-[2rem] bg-card p-8 shadow-(--shadow-raised) ring-1 ring-foreground/[0.04] dark:ring-white/[0.07]">
          <span className="text-sm font-medium text-primary">{c.label}</span>
          <h3 className="mt-3 font-heading text-3xl leading-[1.08] font-semibold tracking-[-0.03em]">{c.title}</h3>
          <ul className="mt-6 divide-y divide-border/70 border-y border-border/70">
            {c.points.map((p) => (
              <li key={p} className="py-3 text-[15px]">
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
            {c.link}
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}

function Steps() {
  const t = useTranslations("landing.steps");
  const [track, setTrack] = React.useState<"brand" | "creator">("brand");
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20 pb-10 sm:pb-16">
      <div className="mb-12 flex flex-col items-center gap-4 text-center">
        <Pill>{t("label")}</Pill>
        <h2 className="font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
        <TrackSwitch value={track} onChange={setTrack} />
      </div>
      {/* Both tracks share one grid cell, so the section height never jumps; the inactive one fades out and is inert. */}
      <div className="grid">
        <StepsTrack active={track === "brand"}>
          <BrandSteps />
        </StepsTrack>
        <StepsTrack active={track === "creator"}>
          <CreatorSteps />
        </StepsTrack>
      </div>
    </section>
  );
}

/**
 * Segmented brand/creator switch. The indicator slides with transform only (Emil: ease-out, ~250ms,
 * interruptible transition — not a keyframe), label colours cross-fade.
 */
function TrackSwitch({ value, onChange }: { value: "brand" | "creator"; onChange: (v: "brand" | "creator") => void }) {
  const t = useTranslations("landing.steps");
  const items = [
    { id: "brand", icon: Store01Icon },
    { id: "creator", icon: Video01Icon },
  ] as const;
  return (
    <div role="tablist" className="relative grid grid-cols-2 rounded-full bg-card p-1 shadow-(--shadow-soft) ring-1 ring-foreground/[0.05]">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-foreground shadow-(--shadow-raised) transition-transform duration-250 ease-(--ease-out)"
        style={{ transform: value === "creator" ? "translateX(100%)" : "translateX(0)" }}
      />
      {items.map(({ id, icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              "relative z-10 flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium [transition:color_150ms_ease,scale_120ms_var(--ease-out)] outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
              active ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
            {t(id)}
          </button>
        );
      })}
    </div>
  );
}

function StepsTrack({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!active}
      aria-hidden={!active}
      className={cn(
        "[grid-area:1/1] transition-[opacity,transform] duration-250 ease-(--ease-out)",
        active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

function BrandSteps() {
  const t = useTranslations("landing.steps");
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="space-y-2.5">
            <div className="flex h-9 items-center rounded-full bg-muted px-3.5 text-sm">{t("mockCampaign")}</div>
            <div className="flex gap-2">
              <div className="flex h-9 flex-1 items-center rounded-full bg-muted px-3.5 text-sm tabular-nums">150 AZN</div>
              <div className="flex h-9 flex-1 items-center rounded-full bg-muted px-3.5 text-sm">{t("mockDeadline")}</div>
            </div>
            <Button className="w-full">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("one")}
            </Button>
          </div>
        </AppWindow>
        <StepCaption n={1} title={t("one")} sub={t("oneSub")} />
      </div>
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="divide-y divide-border/70">
            {[
              ["@aysel.mmd", "18 340", true],
              ["@nigar.cooks", "9 712", false],
              ["@leyla.home", "31 055", false],
            ].map(([h, f, sel]) => (
              <div key={h as string} className="flex items-center gap-3 py-2.5">
                <span className={cn("flex-1 truncate text-sm", sel ? "font-semibold" : "text-muted-foreground")}>{h}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{f}</span>
                <span className={cn("size-4 rounded-full border", sel ? "border-[5px] border-primary" : "border-border")} />
              </div>
            ))}
          </div>
        </AppWindow>
        <StepCaption n={2} title={t("two")} sub={t("twoSub")} />
      </div>
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 font-mono text-xs text-muted-foreground">
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
              instagram.com/reel/…
            </div>
            <div className="flex items-end justify-between px-1">
              <div className="font-heading text-4xl font-semibold tracking-[-0.03em] tabular-nums">48 213</div>
              <Badge variant="mint" className="size-7 rounded-full p-0">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
              </Badge>
            </div>
          </div>
        </AppWindow>
        <StepCaption n={3} title={t("three")} sub={t("threeSub")} />
      </div>
    </div>
  );
}

function CreatorSteps() {
  const t = useTranslations("landing.steps");
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm font-semibold">@aysel.mmd</span>
              <span className="text-xs text-muted-foreground tabular-nums">18 340 {t("cFollowers")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[t("cNiche"), "Reels", "TikTok"].map((c) => (
                <span key={c} className="flex h-8 items-center rounded-full bg-muted px-3 text-xs font-medium">
                  {c}
                </span>
              ))}
            </div>
            <Button className="w-full">
              <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} data-icon="inline-start" />
              {t("cOne")}
            </Button>
          </div>
        </AppWindow>
        <StepCaption n={1} title={t("cOne")} sub={t("cOneSub")} />
      </div>
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="space-y-3">
            <div className="px-1">
              <div className="text-sm font-semibold">Decoliv · {t("cNiche")}</div>
              <div className="mt-1 text-xs text-muted-foreground tabular-nums">150 AZN · Reels · {t("mockDeadline")}</div>
            </div>
            <Button className="w-full">
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
              {t("cTwo")}
            </Button>
          </div>
        </AppWindow>
        <StepCaption n={2} title={t("cTwo")} sub={t("cTwoSub")} />
      </div>
      <div className="flex flex-col gap-4">
        <AppWindow className="flex-1">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 font-mono text-xs text-muted-foreground">
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
              instagram.com/reel/…
            </div>
            <div className="flex items-end justify-between px-1">
              <div className="font-heading text-4xl font-semibold tracking-[-0.03em] tabular-nums">+150 AZN</div>
              <Badge variant="mint" className="size-7 rounded-full p-0">
                <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />
              </Badge>
            </div>
          </div>
        </AppWindow>
        <StepCaption n={3} title={t("cThree")} sub={t("cThreeSub")} />
      </div>
    </div>
  );
}

function StepCaption({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-3 px-2">
      <span className="font-mono text-xs text-muted-foreground">0{n}</span>
      <div>
        <div className="font-heading text-xl font-semibold tracking-[-0.02em]">{title}</div>
        <div className="text-sm text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function Marquee() {
  const t = useTranslations("landing");
  const words = t("marquee").split(",");
  const row = (hidden?: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-6 pr-6 sm:gap-10 sm:pr-10">
      {words.map((w, i) => (
        <span key={w} className={cn("font-heading text-3xl font-semibold tracking-[-0.04em] whitespace-nowrap sm:text-7xl", i % 3 === 1 ? "text-primary" : "text-foreground/90")}>
          {w}
          <span className="pl-6 text-foreground/20 sm:pl-10">·</span>
        </span>
      ))}
    </div>
  );
  return (
    <section className="overflow-hidden py-2 sm:py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee">
        {row()}
        {row(true)}
      </div>
    </section>
  );
}

function Faq() {
  const t = useTranslations("landing.faq");
  return (
    <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 pt-10 pb-20 sm:pt-16">
      <h2 className="mb-10 text-center font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
      <div className="space-y-2.5">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((i) => (
          <details key={i} className="group rounded-3xl bg-card shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] dark:ring-white/[0.07]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-4 text-[15px] font-medium transition-[background-color] duration-100 ease-(--ease-out) active:bg-muted/60 [&::-webkit-details-marker]:hidden">
              {t(`q${i}`)}
              {/* Rare interaction → a small rotation is allowed: 200ms ease-out, transform only (Emil). */}
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground transition-[rotate] duration-200 ease-out group-open:rotate-45" />
            </summary>
            <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted-foreground">{t(`a${i}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Final() {
  const t = useTranslations("landing.final");
  const th = useTranslations("landing.hero");
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {/* envite-style closing: the marketplace drifting by in the background, one app window holding the ask. */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[color-mix(in_oklch,var(--brand-soft),var(--background)_35%)] px-4 py-20 sm:py-28">
        <ActivityWall />

        <AppWindow className="relative mx-auto max-w-xl shadow-(--shadow-float)">
          <div className="px-2 py-8 text-center sm:px-6 sm:py-10">
            <h2 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground sm:text-base">{t("sub")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "brand" } }} />}>
                {th("ctaBrand")}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "creator" } }} />}>
                {th("ctaCreator")}
              </Button>
            </div>
          </div>
        </AppWindow>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("landing.footer");
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-sm text-muted-foreground">
      <span className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
        ugc<span className="text-primary">market</span>
      </span>
      <span>{t("city")}</span>
      <span>{t("rights")}</span>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="min-h-full bg-background bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_9%,transparent)_1px,transparent_1px)] bg-size-[22px_22px] text-foreground">
      <Nav />
      <main>
        <Hero />
        <Partner />
        <Board />
        <Audience />
        <Steps />
        <Marquee />
        <Faq />
        <Final />
      </main>
      <Footer />
    </div>
  );
}

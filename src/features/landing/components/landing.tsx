"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  Link01Icon,
  Megaphone01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HeroProps } from "./hero-props";
import { BoardPhone } from "./phone";
import { AppWindow } from "./window";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "az", label: "Azərbaycanca" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

function LanguageMenu() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} data-icon="inline-start" />
        {locale.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={locale} onValueChange={(v) => router.replace(pathname, { locale: v as Locale })}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.value} value={l.value}>
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,black_calc(100%-8px),transparent)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link href="/" className="font-heading text-lg font-semibold tracking-[-0.03em]">
          ugc<span className="text-primary">market</span>
        </Link>
        <nav className="ml-8 hidden gap-1 md:flex">
          {(["how", "brands", "faq"] as const).map((k) => (
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
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
      <HeroProps />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="animate-enter">
          <Pill>{t("eyebrow")}</Pill>
        </div>
        <h1 className="mt-6 animate-enter font-heading text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.045em] [animation-delay:50ms]">
          {t("titleA")} <span className="text-primary">{t("titleAccent")}</span>
          <br />
          {t("titleB")}
        </h1>
        <p className="mt-6 max-w-md animate-enter text-lg leading-relaxed text-muted-foreground [animation-delay:100ms]">{t("sub")}</p>
        <div className="mt-8 animate-enter [animation-delay:150ms]">
          <CtaButtons />
          <p className="mt-3 text-xs text-muted-foreground">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}

function Board() {
  const t = useTranslations("landing.board");
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 md:grid-cols-2">
      <div className="space-y-4 text-center md:text-left">
        <Pill>{t("label")}</Pill>
        <h2 className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto max-w-sm text-lg text-muted-foreground md:mx-0">{t("sub")}</p>
      </div>
      <BoardPhone />
    </section>
  );
}

function Audience() {
  const t = useTranslations("landing.audience");
  const cards = [
    {
      id: "brands",
      icon: Megaphone01Icon,
      tone: "bg-brand-soft text-brand-ink",
      label: t("brandsLabel"),
      title: t("brandsTitle"),
      points: [t("brands1"), t("brands2"), t("brands3")],
      visual: (
        <AvatarGroup>
          {["Aysel Məmmədova", "Nigar Rəhimli", "Leyla Kərimova", "Tural Səfərov", "Rəşad Quliyev"].map((n) => (
            <NamedAvatar key={n} name={n} single size="lg" />
          ))}
        </AvatarGroup>
      ),
    },
    {
      id: "creators",
      icon: UserGroupIcon,
      tone: "bg-mint text-mint-ink",
      label: t("creatorsLabel"),
      title: t("creatorsTitle"),
      points: [t("creators1"), t("creators2"), t("creators3")],
      visual: (
        <div className="flex items-center gap-2 rounded-full bg-muted py-1.5 pr-4 pl-1.5 font-mono text-xs text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-full bg-card text-foreground shadow-(--shadow-soft)">
            <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
          </span>
          ugcmarket.az/creator/aysel
        </div>
      ),
    },
  ];
  return (
    <section id="brands" className="mx-auto grid max-w-6xl scroll-mt-20 gap-4 px-4 py-12 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.id} id={c.id === "creators" ? "creators" : undefined} className="flex flex-col gap-6 rounded-[2rem] bg-card p-8 shadow-(--shadow-raised) ring-1 ring-foreground/[0.04] dark:ring-white/[0.07]">
          <div className="flex items-center justify-between">
            <span className={cn("flex size-11 items-center justify-center rounded-2xl", c.tone)}>
              <HugeiconsIcon icon={c.icon} strokeWidth={2} className="size-5" />
            </span>
            <span className="text-sm text-muted-foreground">{c.label}</span>
          </div>
          <h3 className="font-heading text-3xl leading-[1.08] font-semibold tracking-[-0.03em]">{c.title}</h3>
          <ul className="space-y-2.5">
            {c.points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[15px]">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2">{c.visual}</div>
        </div>
      ))}
    </section>
  );
}

function Steps() {
  const t = useTranslations("landing.steps");
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mb-12 space-y-4 text-center">
        <Pill>{t("label")}</Pill>
        <h2 className="font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <AppWindow title="1-kampaniya.ugc" className="flex-1">
            <div className="space-y-2.5">
              <div className="flex h-9 items-center rounded-full bg-muted px-3.5 text-sm">Yeni kolleksiya — Reels</div>
              <div className="flex gap-2">
                <div className="flex h-9 flex-1 items-center rounded-full bg-muted px-3.5 text-sm tabular-nums">150 AZN</div>
                <div className="flex h-9 flex-1 items-center rounded-full bg-muted px-3.5 text-sm">30 noy</div>
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
          <AppWindow title="2-secim.ugc" className="flex-1">
            <div className="space-y-1">
              {[
                ["Aysel Məmmədova", "18.4K", true],
                ["Nigar Rəhimli", "9.7K", false],
                ["Leyla Kərimova", "31K", false],
              ].map(([n, f, sel]) => (
                <div key={n as string} className={cn("flex items-center gap-3 rounded-2xl px-2.5 py-2", sel && "bg-brand-soft")}>
                  <NamedAvatar name={n as string} size="sm" />
                  <span className="flex-1 truncate text-sm font-medium">{(n as string).split(" ")[0]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{f}</span>
                  {sel && <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4 text-brand-ink" />}
                </div>
              ))}
            </div>
          </AppWindow>
          <StepCaption n={2} title={t("two")} sub={t("twoSub")} />
        </div>
        <div className="flex flex-col gap-4">
          <AppWindow title="3-netice.ugc" className="flex-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 font-mono text-xs text-muted-foreground">
                <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
                instagram.com/reel/…
              </div>
              <div className="flex items-end justify-between px-1">
                <div className="font-heading text-4xl font-semibold tracking-[-0.03em] tabular-nums">48.2K</div>
                <Badge variant="mint" className="size-7 rounded-full p-0">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
                </Badge>
              </div>
            </div>
          </AppWindow>
          <StepCaption n={3} title={t("three")} sub={t("threeSub")} />
        </div>
      </div>
    </section>
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
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-10 pr-10">
      {words.map((w, i) => (
        <span key={w} className={cn("font-heading text-5xl font-semibold tracking-[-0.04em] whitespace-nowrap sm:text-7xl", i % 3 === 1 ? "text-primary" : "text-foreground/90")}>
          {w}
          <span className="pl-10 text-foreground/20">·</span>
        </span>
      ))}
    </div>
  );
  return (
    <section className="overflow-hidden py-16 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
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
    <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 py-20">
      <h2 className="mb-10 text-center font-heading text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("title")}</h2>
      <div className="space-y-2.5">
        {([1, 2, 3, 4] as const).map((i) => (
          <details key={i} className="group rounded-3xl bg-card shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] dark:ring-white/[0.07]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-20 text-center text-primary-foreground shadow-(--shadow-press)">
        <div aria-hidden className="absolute -top-24 -left-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -right-10 -bottom-28 size-80 rounded-full bg-sun/30 blur-3xl" />
        <h2 className="relative font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-6xl">{t("title")}</h2>
        <p className="relative mt-4 text-lg opacity-85">{t("sub")}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="secondary" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "brand" } }} />}>
            {th("ctaBrand")}
          </Button>
          <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground" nativeButton={false} render={<Link href={{ pathname: "/signup", query: { role: "creator" } }} />}>
            {th("ctaCreator")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("landing.footer");
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground">
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

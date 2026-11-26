"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Call02Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  FilterHorizontalIcon,
  GiftIcon,
  InstagramIcon,
  Loading03Icon,
  Location01Icon,
  Logout01Icon,
  Money03Icon,
  Moon02Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Settings01Icon,
  Sun03Icon,
  TiktokIcon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/shared/category-icon";
import { OneRowChips } from "@/components/shared/one-row-chips";
import { ChipGroup } from "@/features/creators/components/form-bits";
import { SetupWaiting } from "@/features/creators/components/setup-waiting";
import { CREATOR_CATEGORIES, type CreatorCategory } from "@/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Hugeicons with kit defaults. data-icon="inline-start|inline-end" inside buttons/badges tightens padding. */
function Icon({
  icon,
  ...props
}: {
  icon: IconSvgElement;
  className?: string;
  "data-icon"?: "inline-start" | "inline-end";
}) {
  return <HugeiconsIcon icon={icon} strokeWidth={2} {...props} />;
}

const SECTIONS = [
  ["foundations", "Foundations"],
  ["motion", "Motion"],
  ["buttons", "Buttons"],
  ["badges", "Badges"],
  ["forms", "Forms"],
  ["cards", "Cards"],
  ["overlays", "Overlays"],
  ["feedback", "Feedback"],
  ["patterns", "Patterns"],
] as const;

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h2 className="font-heading text-3xl leading-[1.1] font-semibold tracking-[-0.025em] sm:text-4xl">
          {title}
        </h2>
        {description && <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** A quiet surface for specimens: depth from shadow, not an outline. */
function Panel({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-card shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] dark:ring-white/[0.07]">
      {label && <p className="px-6 pt-5 text-xs font-medium text-muted-foreground">{label}</p>}
      <div className={cn("flex flex-wrap items-center gap-3 p-6", label && "pt-4", className)}>
        {children}
      </div>
    </div>
  );
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // Toggle on <html> so portalled overlays follow. Ease the swap (Apple: avoid abrupt brightness jumps).
    const root = document.documentElement;
    root.style.transition = "background-color 300ms ease";
    root.classList.toggle("dark", dark);
    return () => root.classList.remove("dark");
  }, [dark]);
  return [dark, setDark] as const;
}

// ─── Hero (stageshow principles: one focal object, one satellite, few real words) ─

function Hero() {
  return (
    <section className="grid items-center gap-12 pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="animate-enter space-y-6">
        <Badge variant="brand" className="h-6 px-2.5">
          UGCMarket design system
        </Badge>
        <h1 className="font-heading text-5xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl">
          Brendlər və kreatorlar,
          <br />
          <span className="text-primary">bir yerdə.</span>
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
          The kit behind every UGCMarket screen. Warm, quick to respond, and calm enough to let creators&apos;
          work be the color.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" nativeButton={false} render={<a href="#patterns" />}>
            See it in a product
            <Icon icon={ArrowRight01Icon} data-icon="inline-end" />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<a href="#foundations" />}>
            Foundations
          </Button>
        </div>
      </div>

      {/* Product shot: the campaign is the subject; the new application is the satellite straddling its edge. */}
      <div className="relative mx-auto w-full max-w-md pb-10 lg:max-w-none">
        <div
          aria-hidden
          className="absolute inset-x-8 top-10 bottom-0 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_30%_30%,var(--sun),transparent),radial-gradient(60%_60%_at_80%_70%,var(--brand-soft),transparent)] opacity-90 blur-2xl"
        />
        <Card className="animate-enter [animation-delay:50ms]">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <NamedAvatar name="Decoliv" size="sm" />
              <span className="text-sm font-medium">Decoliv</span>
              <Badge variant="mint" className="ml-auto">
                Live
              </Badge>
            </div>
            <CardTitle className="pt-2 text-xl leading-snug tracking-[-0.015em]">
              Yeni kolleksiya üçün ev interyeri Reels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Per creator</div>
                <div className="font-heading text-4xl font-semibold tracking-[-0.03em] tabular-nums">
                  150 <span className="text-xl font-medium text-muted-foreground">AZN</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Badge variant="sky">
                  <Icon icon={InstagramIcon} data-icon="inline-start" />
                  Reels
                </Badge>
                <Badge variant="sun">Bakı</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarGroup>
                {["Aysel Məmmədova", "Nigar Rəhimli", "Leyla Kərimova"].map((n) => (
                  <NamedAvatar key={n} name={n} single />
                ))}
                <AvatarGroupCount>+21</AvatarGroupCount>
              </AvatarGroup>
              <span className="text-sm text-muted-foreground">24 applied</span>
            </div>
          </CardContent>
        </Card>
        <div className="absolute right-3 bottom-0 w-[calc(100%-1.5rem)] animate-enter rounded-3xl bg-popover/85 p-3.5 shadow-(--shadow-float) ring-1 ring-foreground/5 backdrop-blur-xl backdrop-saturate-150 [animation-delay:100ms] sm:right-[-6%] sm:w-[76%] dark:ring-white/10">
          <div className="flex items-center gap-3">
            <NamedAvatar name="Aysel Məmmədova" badge />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">Aysel applied</div>
              <div className="truncate text-xs text-muted-foreground">18.4K followers · 9.1K avg views</div>
            </div>
            <Button size="sm" variant="soft">
              View
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Foundations ─────────────────────────────────────────────────────────────

const CORE_TOKENS = [
  ["primary", "primary-foreground", "Sunset: actions"],
  ["foreground", "background", "Ink"],
  ["muted", "muted-foreground", "Fields & quiet surfaces"],
  ["card", "card-foreground", "Cards & popovers"],
  ["destructive", null, "Destructive"],
  ["border", null, "Hairlines"],
] as const;
const JOY = [
  ["brand-soft", "brand-ink", "Brand"],
  ["sun", "sun-ink", "Sun"],
  ["mint", "mint-ink", "Mint"],
  ["sky", "sky-ink", "Sky"],
  ["rose", "rose-ink", "Rose"],
] as const;

function Foundations() {
  return (
    <Section
      id="foundations"
      eyebrow="Foundations"
      title="Warm, quiet, and one color that means go."
      description="Coral is reserved for the action on a screen. Everything else is warm neutrals and depth. The joy palette tints categories, networks and statuses, never buttons."
    >
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Panel label="Core" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CORE_TOKENS.map(([bg, fg, name]) => (
            <div key={bg} className="space-y-2">
              <div
                className="flex h-20 items-end rounded-2xl p-3 text-sm font-semibold ring-1 ring-foreground/[0.06] ring-inset"
                style={{ background: `var(--${bg})`, color: fg ? `var(--${fg})` : undefined }}
              >
                {fg ? "Aa" : ""}
              </div>
              <div className="px-0.5">
                <div className="text-sm font-medium">{name}</div>
                <div className="font-mono text-xs text-muted-foreground">--{bg}</div>
              </div>
            </div>
          ))}
        </Panel>
        <Panel label="Joy palette" className="grid gap-2">
          {JOY.map(([bg, ink, name]) => (
            <div
              key={bg}
              className="flex h-11 items-center justify-between rounded-2xl px-4 text-sm font-semibold"
              style={{ background: `var(--${bg})`, color: `var(--${ink})` }}
            >
              {name}
              <span className="font-mono text-xs font-normal opacity-80">--{bg}</span>
            </div>
          ))}
        </Panel>
      </div>

      <Panel label="Type: Geist, tracking tightens as size grows" className="block space-y-5">
        {[
          ["Display · 60 / −3.5%", "text-6xl font-semibold tracking-[-0.035em] leading-[1.02]", "Bir yerdə."],
          [
            "Title · 36 / −2.5%",
            "text-4xl font-semibold tracking-[-0.025em] leading-[1.1]",
            "Kampaniyanı 5 dəqiqəyə yerləşdir",
          ],
          ["Headline · 20 / −1.5%", "text-xl font-semibold tracking-[-0.015em]", "Бренды и контент-креаторы"],
          [
            "Body · 15 / 0",
            "text-[15px] leading-relaxed",
            "Bakıda yeni restoran üçün Instagram Reels çəkəcək 3 kreator axtarırıq. Barter mümkündür.",
          ],
          [
            "Caption · 13",
            "text-[13px] text-muted-foreground",
            "Son tarix: 30 noyabr · Minimum 5.000 izləyici",
          ],
        ].map(([meta, cls, text]) => (
          <div key={meta} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-baseline">
            <span className="font-mono text-xs text-muted-foreground">{meta}</span>
            <span className={cn("font-heading", cls)}>{text}</span>
          </div>
        ))}
        <Separator />
        <p className="text-sm">
          <span className="text-muted-foreground">Glyphs · </span>Ə ə Ğ ğ I ı İ i Ş ş Ç ç Ö ö Ü ü · Ё ж щ ы э
          ю я
        </p>
      </Panel>

      <Panel
        label="Depth: shadows do the work outlines used to"
        className="grid grid-cols-2 gap-6 sm:grid-cols-4"
      >
        {[
          ["soft", "Fields, chips"],
          ["raised", "Cards"],
          ["float", "Popovers, sheets"],
          ["press", "Primary button"],
        ].map(([s, use]) => (
          <div key={s} className="space-y-3">
            <div
              className={cn("h-20 rounded-2xl", s === "press" ? "bg-primary" : "bg-card")}
              style={{ boxShadow: `var(--shadow-${s})` }}
            />
            <div>
              <div className="font-mono text-xs">--shadow-{s}</div>
              <div className="text-xs text-muted-foreground">{use}</div>
            </div>
          </div>
        ))}
      </Panel>
    </Section>
  );
}

// ─── Motion ──────────────────────────────────────────────────────────────────

const CURVES = [
  ["--ease-out", "var(--ease-out)", "Enter/exit, press, popovers · 150–250ms", 250],
  ["--ease-in-out", "var(--ease-in-out)", "Moving on screen · tab indicator 250ms", 250],
  ["--ease-drawer", "var(--ease-drawer)", "Sheets & drawers · 500ms", 500],
] as const;

function Motion() {
  const [on, setOn] = useState(false);
  return (
    <Section
      id="motion"
      eyebrow="Motion"
      title="Every animation earns its place."
      description="Strictly Emil Kowalski's rules: animate only with a purpose, transform and opacity only, ease-out for enter/exit, ease-in-out for movement, ease for color, UI under 300ms, popovers from their trigger, never from scale(0), transitions over keyframes. Reduced motion keeps fades and drops movement."
    >
      <Panel className="block space-y-5">
        {CURVES.map(([name, curve, use, ms]) => (
          <div key={name} className="grid items-center gap-3 sm:grid-cols-[220px_1fr]">
            <div>
              <div className="font-mono text-xs">{name}</div>
              <div className="text-xs text-muted-foreground">{use}</div>
            </div>
            <div className="relative h-10 rounded-full bg-muted">
              <div className="[container-type:inline-size] absolute inset-1">
                <div
                  className="size-8 rounded-full bg-primary shadow-(--shadow-press)"
                  style={{
                    transform: on ? "translateX(calc(100cqw - 2rem))" : "translateX(0)",
                    transition: `transform ${ms}ms ${curve}`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <Button variant="soft" onClick={() => setOn((v) => !v)}>
            {on ? "Back" : "Play curves"}
          </Button>
          <span className="text-xs text-muted-foreground">Interruptible: press again mid-flight.</span>
        </div>
      </Panel>
    </Section>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = ["default", "soft", "secondary", "outline", "ghost", "destructive", "link"] as const;

/** State morph: idle → sending → applied. Each new label enters from blur(2px)/0.7 via @starting-style —
 *  Emil Kowalski's blur mask, as a transition (interruptible), not keyframes. */
function ApplyButton() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = { idle: "Apply", sending: "Sending", done: "Applied" }[state];
  return (
    <Button
      size="lg"
      className={cn("min-w-36", state === "done" && "bg-mint text-mint-ink shadow-none hover:bg-mint")}
      onClick={() => {
        if (state === "sending") return;
        if (state === "done") return setState("idle");
        setState("sending");
        timer.current = setTimeout(() => setState("done"), 1100);
      }}
    >
      <span
        key={state}
        className="flex items-center gap-2 [transition:filter_200ms_ease,opacity_200ms_ease] starting:opacity-70 starting:blur-[2px]"
      >
        {state === "sending" && <Icon icon={Loading03Icon} className="size-4 animate-spin" />}
        {state === "done" && <Icon icon={CheckmarkCircle02Icon} className="size-4" />}
        {label}
      </span>
    </Button>
  );
}

function Buttons() {
  return (
    <Section
      id="buttons"
      eyebrow="Buttons"
      title="Press it. It presses back."
      description="Every button scales to 0.97 on press in 160ms with --ease-out. One primary per screen; soft for secondary actions that still belong to the brand."
    >
      <Panel label="Variants">
        {BUTTON_VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {v[0].toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label="Sizes">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </Panel>
        <Panel label="State morph: try it">
          <ApplyButton />
          <span className="text-xs text-muted-foreground">
            Idle → sending → applied, with blur-masked swaps.
          </span>
        </Panel>
      </div>
      <Panel label="With icons · icon-only · states">
        <Button>
          <Icon icon={Add01Icon} data-icon="inline-start" />
          New campaign
        </Button>
        <Button variant="soft">
          <Icon icon={InstagramIcon} data-icon="inline-start" />
          Connect Instagram
        </Button>
        <Button variant="outline">
          Apply
          <Icon icon={ArrowRight01Icon} data-icon="inline-end" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button size="icon-sm" variant="outline" aria-label="Edit">
          <Icon icon={Edit02Icon} />
        </Button>
        <Button size="icon" variant="ghost" aria-label="More">
          <Icon icon={MoreHorizontalIcon} />
        </Button>
        <Button size="icon-lg" aria-label="Add">
          <Icon icon={Add01Icon} />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button disabled>Disabled</Button>
        <Button variant="destructive">
          <Icon icon={Delete02Icon} data-icon="inline-start" />
          Delete
        </Button>
      </Panel>
    </Section>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function Badges() {
  return (
    <Section
      id="badges"
      eyebrow="Badges"
      title="Color that sorts, not shouts."
      description="Joy tints mark what something is (a network, a reward, a status), so a board of campaigns scans at a glance."
    >
      <Panel label="Variants">
        {(
          ["default", "brand", "sun", "mint", "sky", "rose", "secondary", "outline", "destructive"] as const
        ).map((v) => (
          <Badge key={v} variant={v}>
            {v[0].toUpperCase() + v.slice(1)}
          </Badge>
        ))}
      </Panel>
      <Panel label="In product">
        <Badge variant="sky">
          <Icon icon={InstagramIcon} data-icon="inline-start" />
          Reels
        </Badge>
        <Badge variant="rose">
          <Icon icon={TiktokIcon} data-icon="inline-start" />
          TikTok
        </Badge>
        <Badge variant="brand">
          <Icon icon={Money03Icon} data-icon="inline-start" />
          150 AZN
        </Badge>
        <Badge variant="sun">
          <Icon icon={GiftIcon} data-icon="inline-start" />
          Barter
        </Badge>
        <Badge variant="mint">
          <Icon icon={CheckmarkBadge01Icon} data-icon="inline-start" />
          Verified collaboration
        </Badge>
        <Badge variant="secondary">Pending review</Badge>
        <Badge variant="outline">Self-reported</Badge>
      </Panel>
    </Section>
  );
}

// ─── Forms ───────────────────────────────────────────────────────────────────

const NETWORKS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];
const CITIES = [
  { value: "baku", label: "Bakı" },
  { value: "ganja", label: "Gəncə" },
  { value: "sumgait", label: "Sumqayıt" },
];

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="px-3.5 text-xs font-medium text-destructive">{error}</p>
      ) : (
        hint && <p className="px-3.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Forms() {
  return (
    <Section
      id="forms"
      eyebrow="Forms"
      title="Filled fields, a warm halo on focus."
      description="Fields sit on the muted surface and lift to white with a soft coral ring when focused. Errors are inline, in plain words."
    >
      <Panel className="grid gap-6 md:grid-cols-2">
        <Field id="f-title" label="Campaign title" hint="Shown on the campaign board.">
          <Input id="f-title" placeholder="Yeni restoranın açılışı üçün Reels" />
        </Field>
        <Field id="f-handle" label="Username" error="Bu istifadəçi adı artıq tutulub.">
          <Input id="f-handle" defaultValue="aysel" aria-invalid />
        </Field>
        <Field id="f-search" label="Search">
          <div className="relative">
            <Icon
              icon={Search01Icon}
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input id="f-search" placeholder="Search campaigns" className="pl-10" />
          </div>
        </Field>
        <Field id="f-disabled" label="Disabled">
          <Input id="f-disabled" placeholder="Not editable" disabled />
        </Field>
        <Field id="f-network" label="Social network">
          <Select items={NETWORKS}>
            <SelectTrigger id="f-network" className="w-full">
              <SelectValue placeholder="Choose network" />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((n) => (
                <SelectItem key={n.value} value={n.value}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="f-city" label="City">
          <Select items={CITIES} defaultValue="baku">
            <SelectTrigger id="f-city" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Azərbaycan</SelectLabel>
                {CITIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field id="f-city-search" label="City (searchable)" hint="Combobox: for long lists.">
          <Combobox items={CITIES} defaultValue={null} autoHighlight>
            <ComboboxTrigger id="f-city-search" className="w-full">
              <ComboboxValue placeholder="Choose city">
                {(c: (typeof CITIES)[number]) => c.label}
              </ComboboxValue>
            </ComboboxTrigger>
            <ComboboxContent searchPlaceholder="Search" empty="Nothing found">
              {(c: (typeof CITIES)[number]) => (
                <ComboboxItem key={c.value} value={c}>
                  {c.label}
                </ComboboxItem>
              )}
            </ComboboxContent>
          </Combobox>
        </Field>
        <div className="md:col-span-2">
          <Field id="f-desc" label="Description" hint="Grows with what you write.">
            <Textarea
              id="f-desc"
              placeholder="Brendiniz, məhsul və kreatordan gözləntiləriniz haqqında yazın…"
            />
          </Field>
        </div>
      </Panel>
      <Panel label="Segmented control (Tabs): the indicator slides" className="grid gap-8 md:grid-cols-2">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="px-1 pt-2 text-muted-foreground">
            All campaigns.
          </TabsContent>
          <TabsContent value="published" className="px-1 pt-2 text-muted-foreground">
            Live on the board.
          </TabsContent>
          <TabsContent value="drafts" className="px-1 pt-2 text-muted-foreground">
            Not visible to creators yet.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="profile">
          <TabsList variant="line">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="px-1 pt-2 text-muted-foreground">
            Name, city, categories.
          </TabsContent>
          <TabsContent value="portfolio" className="px-1 pt-2 text-muted-foreground">
            Instagram and TikTok links.
          </TabsContent>
          <TabsContent value="prices" className="px-1 pt-2 text-muted-foreground">
            Reels, Stories, TikTok.
          </TabsContent>
        </Tabs>
      </Panel>
    </Section>
  );
}

// ─── Cards & avatars ─────────────────────────────────────────────────────────

function Cards() {
  return (
    <Section
      id="cards"
      eyebrow="Cards & avatars"
      title="Depth instead of borders."
      description="Cards float on a layered shadow with a hairline you barely see. Named avatars take their own color, so a list of people never looks like a list of gray dots."
    >
      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand profile</CardTitle>
            <CardDescription>Shown to creators when they open your campaigns.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label="Edit">
                <Icon icon={Edit02Icon} />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="c-name" className="px-1">
              Name
            </Label>
            <Input id="c-name" defaultValue="Decoliv" />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
        <div className="grid gap-4">
          <Card size="sm">
            <CardContent className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Applications", "24", "bg-brand-soft text-brand-ink"],
                ["Posts", "9", "bg-sky text-sky-ink"],
                ["Views", "48.2K", "bg-mint text-mint-ink"],
              ].map(([k, v, c]) => (
                <div key={k} className={cn("rounded-2xl py-3", c)}>
                  <div className="font-heading text-xl font-semibold tracking-[-0.02em] tabular-nums">
                    {v}
                  </div>
                  <div className="text-xs font-medium opacity-80">{k}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Panel label="Avatars">
            <NamedAvatar name="Aysel Məmmədova" size="sm" />
            <NamedAvatar name="Nigar Rəhimli" />
            <NamedAvatar name="Leyla Kərimova" size="lg" />
            <NamedAvatar name="Decoliv" size="lg" badge />
            <Separator orientation="vertical" className="mx-1 h-8" />
            <AvatarGroup>
              {["Aysel Məmmədova", "Nigar Rəhimli", "Leyla Kərimova", "Tural Səfərov"].map((n) => (
                <NamedAvatar key={n} name={n} single />
              ))}
              <AvatarGroupCount>+12</AvatarGroupCount>
            </AvatarGroup>
          </Panel>
        </div>
      </div>
    </Section>
  );
}

// ─── Overlays ────────────────────────────────────────────────────────────────

function Overlays() {
  const [showViews, setShowViews] = useState(true);
  const [lang, setLang] = useState("az");
  return (
    <Section
      id="overlays"
      eyebrow="Overlays"
      title="Grows from where you tapped."
      description="Menus and selects scale from their trigger; dialogs stay centered and dim the page lightly; sheets slide the full distance on the iOS drawer curve and leave the way they came."
    >
      <Panel>
        <Dialog>
          <DialogTrigger render={<Button />}>Apply to campaign</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-mint text-mint-ink">
                <Icon icon={CheckmarkCircle02Icon} className="size-5" />
              </div>
              <DialogTitle>Application sent</DialogTitle>
              <DialogDescription>Message Decoliv directly to agree on the details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-1 rounded-2xl bg-muted p-1.5 text-sm">
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <Icon icon={InstagramIcon} className="size-4 text-muted-foreground" />
                @decoliv.az
              </div>
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 tabular-nums">
                <Icon icon={Call02Icon} className="size-4 text-muted-foreground" />
                +994 50 000 00 00
              </div>
            </div>
            <DialogFooter showCloseButton>
              <Button>
                <Icon icon={InstagramIcon} data-icon="inline-start" />
                Open Instagram
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger render={<Button variant="destructive" />}>Delete campaign</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete this campaign?</DialogTitle>
              <DialogDescription>
                Applications and post links will be removed. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <DialogClose
                render={<Button variant="destructive" />}
                onClick={() => toast.success("Campaign deleted")}
              >
                Delete
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            <Icon icon={FilterHorizontalIcon} data-icon="inline-start" />
            Filters
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter campaigns</SheetTitle>
              <SheetDescription>Narrow the board by network and reach.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-5 px-6">
              <div className="grid gap-2">
                <Label className="px-1">Network</Label>
                <Select items={NETWORKS}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s-min" className="px-1">
                  Minimum followers
                </Label>
                <Input id="s-min" inputMode="numeric" placeholder="5 000" />
              </div>
            </div>
            <SheetFooter>
              <Button size="lg">Show 24 campaigns</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Bottom sheet</SheetTrigger>
          <SheetContent side="bottom" className="mx-auto max-w-lg">
            <SheetHeader>
              <SheetTitle>Share your profile</SheetTitle>
              <SheetDescription>ugcmarket.az/creator/aysel</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button size="lg" onClick={() => toast.success("Link copied")}>
                <Icon icon={Copy01Icon} data-icon="inline-start" />
                Copy link
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <Icon icon={UserIcon} data-icon="inline-start" />
            Account
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Decoliv</DropdownMenuLabel>
              <DropdownMenuItem>
                <Icon icon={UserIcon} />
                Brand profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon={Settings01Icon} />
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem checked={showViews} onCheckedChange={setShowViews}>
                Show view counts
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={lang} onValueChange={setLang}>
                <DropdownMenuRadioItem value="az">Azərbaycanca</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ru">Русский</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Icon icon={Logout01Icon} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Panel>
    </Section>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

function Feedback() {
  return (
    <Section
      id="feedback"
      eyebrow="Feedback"
      title="Say what happened, then get out of the way."
      description="Toasts for completion and status, skeletons that shimmer gently while content loads."
    >
      <Panel label="Toasts">
        <Button variant="outline" onClick={() => toast.success("Post link submitted")}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error("Bu istifadəçi adı artıq tutulub")}>
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.info("Your campaign is waiting for review")}>
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(new Promise((r) => setTimeout(r, 1500)), {
              loading: "Publishing campaign…",
              success: "Campaign published",
              error: "Could not publish",
            })
          }
        >
          Promise
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast("Application sent", {
              description: "Brand contact is now visible.",
              action: { label: "Undo", onClick: () => toast("Undone") },
            })
          }
        >
          With action
        </Button>
      </Panel>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} size="sm">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-4xl" />
                <Skeleton className="h-5 w-20 rounded-4xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ─── Patterns ────────────────────────────────────────────────────────────────

function CampaignCard({
  brand,
  title,
  network,
  format,
  amount,
  barter,
  city,
  deadline,
  applied,
}: {
  brand: string;
  title: string;
  network: "instagram" | "tiktok";
  format: string;
  amount?: string;
  barter?: boolean;
  city: string;
  deadline: string;
  applied: number;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2.5">
          <NamedAvatar name={brand} size="sm" />
          <span className="min-w-0 truncate text-sm text-muted-foreground">{brand}</span>
        </div>
        <CardAction>
          <Button variant="ghost" size="icon-xs" aria-label="More">
            <Icon icon={MoreHorizontalIcon} />
          </Button>
        </CardAction>
        <CardTitle className="pt-1 leading-snug tracking-[-0.01em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-1.5">
        <Badge variant={network === "instagram" ? "sky" : "rose"}>
          <Icon icon={network === "instagram" ? InstagramIcon : TiktokIcon} data-icon="inline-start" />
          {format}
        </Badge>
        {barter ? (
          <Badge variant="sun">
            <Icon icon={GiftIcon} data-icon="inline-start" />
            Barter
          </Badge>
        ) : (
          <Badge variant="brand">{amount}</Badge>
        )}
      </CardContent>
      <CardFooter className="mt-auto justify-between gap-2 pt-1 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1">
            <Icon icon={Location01Icon} className="size-3.5" />
            {city}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon={Calendar03Icon} className="size-3.5" />
            {deadline}
          </span>
          <span className="hidden sm:inline">{applied} applied</span>
        </span>
        <Button size="sm">Apply</Button>
      </CardFooter>
    </Card>
  );
}

function CreatorCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <NamedAvatar name="Aysel Məmmədova" size="lg" badge />
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-semibold">
              Aysel Məmmədova
              <Icon icon={CheckmarkBadge01Icon} className="size-4 text-primary" />
            </div>
            <div className="truncate text-sm text-muted-foreground">@aysel · Bakı</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Followers", "18.4K"],
            ["Avg views", "9.1K"],
            ["Collabs", "7"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-muted py-2.5">
              <div className="font-heading font-semibold tracking-[-0.02em] tabular-nums">{v}</div>
              <div className="text-xs text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="sun">Food</Badge>
          <Badge variant="sky">Lifestyle</Badge>
          <Badge variant="mint">Barter OK</Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">
          <Icon icon={ViewIcon} data-icon="inline-start" />
          Profile
        </Button>
        <Button className="flex-1">Contact</Button>
      </CardFooter>
    </Card>
  );
}

function Patterns() {
  return (
    <Section
      id="patterns"
      eyebrow="Patterns"
      title="How it comes together."
      description="Mockups with demo data. When built for real they move to src/features/*/components."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CampaignCard
          brand="Decoliv"
          title="Yeni kolleksiya üçün ev interyeri Reels"
          network="instagram"
          format="Reels"
          amount="150 AZN"
          city="Bakı"
          deadline="30 noy"
          applied={24}
        />
        <CampaignCard
          brand="Şirin Kafe"
          title="Açılış həftəsi: 2 TikTok video, dequstasiya daxildir"
          network="tiktok"
          format="TikTok video"
          barter
          city="Gəncə"
          deadline="5 dek"
          applied={11}
        />
        <CreatorCard />
      </div>
      <Panel label="Creator setup: waiting screen (fake 6 s wait)">
        <SetupWaitingDemo />
      </Panel>
      <Panel label="Content directions: icon chips (Solar icons, the one exception to Hugeicons)">
        <DirectionsDemo />
      </Panel>
      <Panel label="One-row chips (phone profile): at least 3, the rest fold into +N, tap to show all">
        <OneRowDemo />
      </Panel>
      <Panel label="Stress test: long Azerbaijani and Russian strings" className="grid gap-4 md:grid-cols-2">
        <CampaignCard
          brand="Azərbaycan Respublikası Gənclər və İdman Nazirliyinin Tədbirlər Mərkəzi"
          title="Beynəlxalq gənclər festivalının açılış mərasimi üçün çoxdilli qısa videoların hazırlanması və paylaşılması"
          network="instagram"
          format="Reels + Stories"
          amount="1 250 AZN"
          city="Şamaxı"
          deadline="31 dek"
          applied={132}
        />
        <CampaignCard
          brand="Международная сеть кофеен"
          title="Обзор нового сезонного меню в формате коротких вертикальных видео"
          network="tiktok"
          format="TikTok video"
          barter
          city="Сумгайыт"
          deadline="12 янв"
          applied={7}
        />
      </Panel>
    </Section>
  );
}

/** Onboarding's "Kontent istiqamətləri": every direction with its icon; picked ones fill coral. */
function DirectionsDemo() {
  const tt = useTranslations("taxonomy");
  const [value, setValue] = useState<CreatorCategory[]>(["beauty", "travel"]);
  return (
    <ChipGroup
      options={CREATOR_CATEGORIES}
      value={value}
      onChange={setValue}
      label={(c) => tt(`categories.${c}`)}
      renderIcon={(c) => <CategoryIcon category={c} />}
    />
  );
}

/** OneRowChips at a phone-ish width: as many directions as fit, then "+N". */
function OneRowDemo() {
  const tt = useTranslations("taxonomy");
  return (
    <div className="w-80 max-w-full">
      <OneRowChips
        items={CREATOR_CATEGORIES.slice(0, 9).map((c) => (
          <Badge key={c} variant="brand">
            <CategoryIcon category={c} className="size-3.5" />
            {tt(`categories.${c}`)}
          </Badge>
        ))}
        min={3}
        moreClassName={badgeVariants({ variant: "brand" })}
      />
    </div>
  );
}

/** Plays the full-screen wait shown after "Profili yarat": 6 s of swapping cards, then done. */
function SetupWaitingDemo() {
  const [state, setState] = useState<"waiting" | "done" | null>(null);
  useEffect(() => {
    if (state === "waiting") {
      const id = setTimeout(() => setState("done"), 6000);
      return () => clearTimeout(id);
    }
    if (state === "done") {
      const id = setTimeout(() => setState(null), 1500);
      return () => clearTimeout(id);
    }
  }, [state]);
  return (
    <>
      <Button variant="outline" onClick={() => setState("waiting")}>
        Play
      </Button>
      {state && <SetupWaiting done={state === "done"} />}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function UiKitShowcase() {
  const [dark, setDark] = useDarkMode();
  return (
    <div className="min-h-full bg-background text-foreground">
      {/* Translucent chrome; content scrolls underneath (Apple materials). */}
      <header className="sticky top-0 z-30 bg-background/70 [mask-image:linear-gradient(to_bottom,black_calc(100%-8px),transparent)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5">
          <a href="#" className="font-heading text-[15px] font-semibold tracking-[-0.01em]">
            UGCMarket <span className="font-normal text-muted-foreground">UI kit</span>
          </a>
          <nav className="ml-6 hidden flex-1 gap-0.5 lg:flex">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
          <Button
            variant="outline"
            size="icon-sm"
            className="ml-auto"
            aria-label={dark ? "Light mode" : "Dark mode"}
            onClick={() => setDark((d) => !d)}
          >
            <Icon icon={dark ? Sun03Icon : Moon02Icon} />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-28 px-4 pt-10 pb-32 sm:pt-16">
        <Hero />
        <Foundations />
        <Motion />
        <Buttons />
        <Badges />
        <Forms />
        <Cards />
        <Overlays />
        <Feedback />
        <Patterns />
      </main>
    </div>
  );
}

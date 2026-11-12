"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Call02Icon,
  CheckmarkBadge01Icon,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Page scaffolding ────────────────────────────────────────────────────────

const SECTIONS = [
  ["foundations", "Foundations"],
  ["buttons", "Buttons"],
  ["badges", "Badges"],
  ["forms", "Form controls"],
  ["avatars", "Avatars"],
  ["cards", "Cards"],
  ["tabs", "Tabs"],
  ["overlays", "Overlays"],
  ["feedback", "Feedback"],
  ["patterns", "Product patterns"],
] as const;

/** Hugeicons with kit defaults. Pass data-icon="inline-start|inline-end" inside buttons/badges for correct padding. */
function Icon({
  icon,
  ...props
}: { icon: IconSvgElement; className?: string; "data-icon"?: "inline-start" | "inline-end" }) {
  return <HugeiconsIcon icon={icon} strokeWidth={2} {...props} />;
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Preview({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl ring-1 ring-foreground/10">
      {label && (
        <div className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">{label}</div>
      )}
      <div className={cn("flex flex-wrap items-center gap-3 p-6", className)}>{children}</div>
    </div>
  );
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // Toggle on <html> so portalled overlays (dialog, sheet, menus) follow the theme too.
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);
  return [dark, setDark] as const;
}

// ─── Foundations ─────────────────────────────────────────────────────────────

const COLOR_TOKENS = [
  ["background", "foreground"],
  ["card", "card-foreground"],
  ["popover", "popover-foreground"],
  ["primary", "primary-foreground"],
  ["secondary", "secondary-foreground"],
  ["muted", "muted-foreground"],
  ["accent", "accent-foreground"],
  ["destructive", null],
  ["border", null],
  ["input", null],
  ["ring", null],
] as const;

function Foundations() {
  return (
    <Section
      id="foundations"
      title="Foundations"
      description="Design tokens from src/app/globals.css. Change tokens there — components follow automatically."
    >
      <Preview label="Color tokens" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COLOR_TOKENS.map(([bg, fg]) => (
          <div key={bg} className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <div
              className="flex h-16 items-end p-2 text-xs font-medium"
              style={{ background: `var(--${bg})`, color: fg ? `var(--${fg})` : undefined }}
            >
              {fg ? "Aa" : ""}
            </div>
            <div className="space-y-0.5 bg-background px-2 py-1.5">
              <div className="font-mono text-xs">--{bg}</div>
              {fg && <div className="font-mono text-[11px] text-muted-foreground">--{fg}</div>}
            </div>
          </div>
        ))}
      </Preview>

      <Preview label="Chart palette" className="gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <div className="size-10 rounded-xl" style={{ background: `var(--chart-${n})` }} />
            <span className="font-mono text-[11px] text-muted-foreground">chart-{n}</span>
          </div>
        ))}
      </Preview>

      <Preview label="Typography — Geist (self-hosted)" className="block space-y-4">
        <p className="font-heading text-4xl font-semibold tracking-tight">Brendlər və kreatorlar</p>
        <p className="font-heading text-2xl font-semibold tracking-tight">Kampaniyanı 5 dəqiqəyə yerləşdir</p>
        <p className="font-heading text-lg font-medium">Бренды и контент-креаторы</p>
        <p className="text-base">
          Body — Bakıda yeni restoran üçün Instagram Reels çəkəcək 3 kreator axtarırıq. Barter mümkündür.
        </p>
        <p className="text-sm text-muted-foreground">
          Small / muted — Son tarix: 30 noyabr · Minimum 5.000 izləyici
        </p>
        <p className="font-mono text-sm">Mono — ugcmarket.az/creator/aysel · 12,480 views</p>
        <Separator />
        <p className="text-sm">
          <span className="text-muted-foreground">Glyph check (AZ): </span>Ə ə · Ğ ğ · I ı · İ i · Ş ş · Ç ç · Ö ö
          · Ü ü
          <span className="text-muted-foreground"> · (RU): </span>Ё ё · Ж ж · Щ щ · Ы ы · Э э · Ю ю · Я я
        </p>
      </Preview>

      <Preview label="Radius" className="gap-4">
        {[
          ["rounded-md", "md"],
          ["rounded-xl", "xl"],
          ["rounded-2xl", "2xl (cards)"],
          ["rounded-4xl", "4xl (buttons, inputs)"],
          ["rounded-full", "full (avatars)"],
        ].map(([cls, name]) => (
          <div key={cls} className="flex flex-col items-center gap-1.5">
            <div className={cn("size-14 bg-muted ring-1 ring-foreground/10", cls)} />
            <span className="font-mono text-[11px] text-muted-foreground">{name}</span>
          </div>
        ))}
      </Preview>
    </Section>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;

function Buttons() {
  const [loading, setLoading] = useState(false);
  return (
    <Section id="buttons" title="Buttons" description="Base UI Button. 6 variants × 4 sizes, plus icon sizes.">
      <Preview label="Variants">
        {BUTTON_VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {v[0].toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </Preview>
      <Preview label="Sizes">
        {BUTTON_SIZES.map((s) => (
          <Button key={s} size={s}>
            Size {s}
          </Button>
        ))}
      </Preview>
      <Preview label="With icons · icon-only · states">
        <Button>
          <Icon icon={Add01Icon} data-icon="inline-start" />
          New campaign
        </Button>
        <Button variant="outline">
          Apply
          <Icon icon={ArrowRight01Icon} data-icon="inline-end" />
        </Button>
        <Button variant="secondary">
          <Icon icon={InstagramIcon} data-icon="inline-start" />
          Connect Instagram
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button size="icon-xs" variant="outline" aria-label="Edit">
          <Icon icon={Edit02Icon} />
        </Button>
        <Button size="icon-sm" variant="outline" aria-label="Copy link">
          <Icon icon={Copy01Icon} />
        </Button>
        <Button size="icon" variant="ghost" aria-label="More">
          <Icon icon={MoreHorizontalIcon} />
        </Button>
        <Button size="icon-lg" aria-label="Add">
          <Icon icon={Add01Icon} />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button disabled>Disabled</Button>
        <Button
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          {loading && <Icon icon={Loading03Icon} className="animate-spin" />}
          {loading ? "Saving…" : "Click to load"}
        </Button>
        <Button variant="destructive">
          <Icon icon={Delete02Icon} data-icon="inline-start" />
          Delete
        </Button>
      </Preview>
    </Section>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

function Badges() {
  return (
    <Section id="badges" title="Badges" description="Status, compensation and network labels.">
      <Preview label="Variants">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </Preview>
      <Preview label="In product context">
        <Badge variant="secondary">
          <Icon icon={InstagramIcon} data-icon="inline-start" />
          Reels
        </Badge>
        <Badge variant="secondary">
          <Icon icon={TiktokIcon} data-icon="inline-start" />
          TikTok
        </Badge>
        <Badge variant="outline">
          <Icon icon={Money03Icon} data-icon="inline-start" />
          150 AZN
        </Badge>
        <Badge variant="outline">
          <Icon icon={GiftIcon} data-icon="inline-start" />
          Barter
        </Badge>
        <Badge>
          <Icon icon={CheckmarkBadge01Icon} data-icon="inline-start" />
          Verified collaboration
        </Badge>
        <Badge variant="secondary">Pending review</Badge>
        <Badge variant="destructive">Rejected</Badge>
        <Badge variant="outline">Self-reported</Badge>
      </Preview>
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
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="px-3 text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="px-3 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Forms() {
  return (
    <Section
      id="forms"
      title="Form controls"
      description="Input, Textarea, Select (Base UI) and Label. Field is a local composition — promote it to the kit when forms start."
    >
      <Preview className="grid gap-6 md:grid-cols-2">
        <Field id="f-title" label="Campaign title" hint="Shown on the campaign board.">
          <Input id="f-title" placeholder="Yeni restoran açılışı — Reels" />
        </Field>
        <Field id="f-handle" label="Username" error="Bu istifadəçi adı artıq tutulub.">
          <Input id="f-handle" defaultValue="aysel" aria-invalid />
        </Field>
        <Field id="f-search" label="With icon">
          <div className="relative">
            <Icon
              icon={Search01Icon}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input id="f-search" placeholder="Search campaigns" className="pl-9" />
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
        <Field id="f-city" label="City (grouped, small)">
          <Select items={CITIES} defaultValue="baku">
            <SelectTrigger id="f-city" size="sm" className="w-full">
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
        <div className="md:col-span-2">
          <Field id="f-desc" label="Description" hint="Grows with content (field-sizing).">
            <Textarea
              id="f-desc"
              placeholder="Brendiniz, məhsul və kreatordan gözləntiləriniz haqqında yazın…"
            />
          </Field>
        </div>
      </Preview>
    </Section>
  );
}

// ─── Avatars ─────────────────────────────────────────────────────────────────

function Avatars() {
  return (
    <Section id="avatars" title="Avatars" description="Base UI Avatar with fallback initials, badge and group.">
      <Preview>
        <Avatar size="sm">
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>DL</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <Separator orientation="vertical" className="mx-2 h-8" />
        <AvatarGroup>
          {["AM", "NR", "LK", "TS"].map((i) => (
            <Avatar key={i}>
              <AvatarFallback>{i}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+12</AvatarGroupCount>
        </AvatarGroup>
      </Preview>
    </Section>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function Cards() {
  return (
    <Section id="cards" title="Cards" description="Card with header, action, content and footer; default and sm size.">
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
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" defaultValue="Decolive" />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Button variant="ghost">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Small card</CardTitle>
            <CardDescription>size=&quot;sm&quot; — tighter spacing for dense lists.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Applications", "24"],
              ["Posts", "9"],
              ["Views", "48.2K"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/60 p-3">
                <div className="font-heading text-lg font-semibold tabular-nums">{v}</div>
                <div className="text-xs text-muted-foreground">{k}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function TabsDemo() {
  return (
    <Section id="tabs" title="Tabs" description="Default (pill) and line variants.">
      <Preview className="grid gap-8 md:grid-cols-2">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="pt-3 text-muted-foreground">
            All campaigns.
          </TabsContent>
          <TabsContent value="published" className="pt-3 text-muted-foreground">
            Live on the board.
          </TabsContent>
          <TabsContent value="drafts" className="pt-3 text-muted-foreground">
            Not visible to creators yet.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="profile">
          <TabsList variant="line">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="pt-3 text-muted-foreground">
            Name, city, categories.
          </TabsContent>
          <TabsContent value="portfolio" className="pt-3 text-muted-foreground">
            Instagram / TikTok links.
          </TabsContent>
          <TabsContent value="prices" className="pt-3 text-muted-foreground">
            Reels, Stories, TikTok.
          </TabsContent>
        </Tabs>
      </Preview>
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
      title="Overlays"
      description="Dialog, Sheet and Dropdown menu (Base UI). Triggers use the render prop, not asChild."
    >
      <Preview>
        <Dialog>
          <DialogTrigger render={<Button />}>Apply to campaign</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Application sent</DialogTitle>
              <DialogDescription>Contact the brand directly to agree on the details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 rounded-xl bg-muted/60 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Icon icon={InstagramIcon} className="size-4 text-muted-foreground" />
                @decolive.az
              </div>
              <div className="flex items-center gap-2 tabular-nums">
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
              <DialogDescription>Applications and post links will be removed. This can&apos;t be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <DialogClose render={<Button variant="destructive" />} onClick={() => toast.success("Campaign deleted")}>
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
              <SheetDescription>Narrow the board by network and city.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
              <div className="grid gap-2">
                <Label>Network</Label>
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
                <Label htmlFor="s-min">Minimum followers</Label>
                <Input id="s-min" inputMode="numeric" placeholder="5000" />
              </div>
            </div>
            <SheetFooter>
              <Button>Show 24 campaigns</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Bottom sheet (mobile)</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Share your profile</SheetTitle>
              <SheetDescription>ugcmarket.az/creator/aysel</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button onClick={() => toast.success("Link copied")}>
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
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Decolive</DropdownMenuLabel>
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
      </Preview>
    </Section>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

function Feedback() {
  return (
    <Section id="feedback" title="Feedback" description="Toasts (Sonner, mounted in Providers) and loading skeletons.">
      <Preview label="Toasts">
        <Button variant="outline" onClick={() => toast.success("Post link submitted")}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.error("Bu istifadəçi adı artıq tutulub.")}>
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.info("Your campaign is waiting for review")}>
          Info
        </Button>
        <Button variant="outline" onClick={() => toast.warning("Deadline is in 2 days")}>
          Warning
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
      </Preview>
      <Preview label="Skeleton — campaign card loading" className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl p-4 ring-1 ring-foreground/10">
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
          </div>
        ))}
      </Preview>
    </Section>
  );
}

// ─── Product patterns (compositions — candidates for src/features/*/components) ─

function CampaignCardExample({
  brand,
  initials,
  title,
  network,
  format,
  compensation,
  barter,
  city,
  deadline,
}: {
  brand: string;
  initials: string;
  title: string;
  network: "instagram" | "tiktok";
  format: string;
  compensation: string;
  barter?: boolean;
  city: string;
  deadline: string;
}) {
  return (
    <Card size="sm" className="transition-shadow hover:ring-foreground/20">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{brand}</span>
        </div>
        <CardAction>
          <Button variant="ghost" size="icon-xs" aria-label="More">
            <Icon icon={MoreHorizontalIcon} />
          </Button>
        </CardAction>
        <CardTitle className="leading-snug">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          <Icon icon={network === "instagram" ? InstagramIcon : TiktokIcon} data-icon="inline-start" />
          {format}
        </Badge>
        <Badge variant="outline">
          <Icon icon={barter ? GiftIcon : Money03Icon} data-icon="inline-start" />
          {compensation}
        </Badge>
      </CardContent>
      <CardFooter className="mt-auto justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Icon icon={Location01Icon} className="size-3.5" />
            {city}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon={Calendar03Icon} className="size-3.5" />
            {deadline}
          </span>
        </span>
        <Button size="sm">Apply</Button>
      </CardFooter>
    </Card>
  );
}

function CreatorCardExample() {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>AM</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-medium">
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
            <div key={k} className="rounded-xl bg-muted/60 py-2">
              <div className="font-heading font-semibold tabular-nums">{v}</div>
              <div className="text-[11px] text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">Food</Badge>
          <Badge variant="outline">Lifestyle</Badge>
          <Badge variant="outline">Barter OK</Badge>
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
      title="Product patterns"
      description="How the kit composes into UGCMarket screens. These are mockups with demo data — when built for real they move to src/features/*/components."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CampaignCardExample
          brand="Decolive"
          initials="DL"
          title="Yeni kolleksiya üçün ev interyeri Reels"
          network="instagram"
          format="Reels"
          compensation="150 AZN"
          city="Bakı"
          deadline="30 noy"
        />
        <CampaignCardExample
          brand="Şirin Kafe"
          initials="ŞK"
          title="Açılış həftəsi — 2 TikTok video, dequstasiya daxil"
          network="tiktok"
          format="TikTok video"
          compensation="Barter"
          barter
          city="Gəncə"
          deadline="5 dek"
        />
        <CreatorCardExample />
      </div>
      <Preview label="Stress test — long Azerbaijani/Russian strings (break-ui)" className="block">
        <div className="grid gap-4 md:grid-cols-2">
          <CampaignCardExample
            brand="Azərbaycan Respublikası Gənclər və İdman Nazirliyinin Tədbirlər Mərkəzi"
            initials="AR"
            title="Beynəlxalq gənclər festivalının açılış mərasimi üçün çoxdilli qısa videoların hazırlanması və paylaşılması"
            network="instagram"
            format="Reels + Stories"
            compensation="1 250 AZN"
            city="Şamaxı"
            deadline="31 dek"
          />
          <CampaignCardExample
            brand="Международная сеть кофеен"
            initials="МК"
            title="Обзор нового сезонного меню в формате коротких вертикальных видео"
            network="tiktok"
            format="TikTok video"
            compensation="Бартер"
            barter
            city="Сумгайыт"
            deadline="12 янв"
          />
        </div>
      </Preview>
    </Section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function UiKitShowcase() {
  const [dark, setDark] = useDarkMode();
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-semibold">UGCMarket</span>
            <span className="text-sm text-muted-foreground">UI kit</span>
          </div>
          <nav className="ml-4 hidden flex-1 gap-1 overflow-x-auto lg:flex">
            {SECTIONS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-4xl px-2.5 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-10">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">UI kit</h1>
          <p className="max-w-2xl text-muted-foreground">
            Every component in <code className="font-mono text-sm">src/components/ui</code>, in all variants, with
            UGCMarket content. Base UI primitives · shadcn <code className="font-mono text-sm">base-maia</code> ·
            Hugeicons · Geist. Edit the components or tokens and this page updates.
          </p>
        </div>
        <Foundations />
        <Buttons />
        <Badges />
        <Forms />
        <Avatars />
        <Cards />
        <TabsDemo />
        <Overlays />
        <Feedback />
        <Patterns />
      </main>
    </div>
  );
}

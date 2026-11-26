"use client";

import { CategoryIcon } from "@/components/shared/category-icon";
import {
  AlertCircleIcon,
  Alert02Icon,
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  RefreshIcon,
  Location01Icon,
  PencilEdit02Icon,
  Share08Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClampedChips } from "@/components/shared/clamped-chips";
import { LoadingState } from "@/components/shared/loading-state";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { shareOrCopy } from "@/lib/share";
import { cn } from "@/lib/utils";
import { CITIES, normalizeCategories } from "@/schemas";
import { CreatorTags } from "./creator-tags";
import { BoostCard, SectionSheet, type SheetSection } from "./boost-card";
import { type MyCreator, socialNumbers, useMyCreator, useRefreshSocialStats } from "../hooks";
import { DealTerms } from "./deal-terms";
import { PortfolioEditor } from "./portfolio-editor";
import { PortfolioSummary } from "./portfolio-summary";
import { NETWORK_ICON } from "./profile-sections";
import { useCreatorWho } from "../who";

const SOCIAL_URL = {
  instagram: (h: string) => `https://www.instagram.com/${h}/`,
  tiktok: (h: string) => `https://www.tiktok.com/@${h}`,
  youtube: (h: string) => `https://www.youtube.com/@${h}`,
} as const;

const known = <T extends string>(list: readonly T[], v: string): v is T =>
  (list as readonly string[]).includes(v);

/** /me — the creator's home: their profile with everything on one page (Luhive-style). */
export function CreatorDashboard() {
  const t = useTranslations("common");
  const router = useRouter();
  const { data, isPending, isError } = useMyCreator();
  const noProfile = !isPending && !isError && !data;
  // No profile yet: straight into the setup form.
  useEffect(() => {
    if (noProfile) router.replace("/me/profile");
  }, [noProfile, router]);
  if (isPending || noProfile) return <DashboardSkeleton />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return <Home creator={data!} />;
}

/** Same grid as Home: side meta column + avatar header, overview card and tabs. */
function DashboardSkeleton() {
  return (
    <LoadingState className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="order-2 grid content-start gap-3.5 lg:order-1 lg:pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="order-1 grid min-w-0 grid-cols-1 content-start gap-6 lg:order-2">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="size-28 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2.5">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid gap-3">
          <Skeleton className="h-9 w-64 rounded-full" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      </div>
    </LoadingState>
  );
}

function Home({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const tp = useTranslations("creator.public");
  const tt = useTranslations("taxonomy");
  const who = useCreatorWho();
  const [now] = useState(() => Date.now());
  const days = Math.max(0, Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000));

  // The card's Portfolio row: open the tab, bring it into view and outline it for a moment.
  const [tab, setTab] = useState<"portfolio" | "applications">("portfolio");
  const [flash, setFlash] = useState(false);
  // One panel per section (about, terms), opened from the card or the bio link.
  const [sheet, setSheet] = useState<SheetSection | null>(null);
  const showPortfolio = () => {
    setTab("portfolio");
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById("portfolio")
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    });
  };

  // Arriving from the board's profile card: /me#portfolio opens the portfolio (as its row does),
  // /me#boost brings the card into view. Read once per visit; the hash is the URL's, not state.
  useEffect(() => {
    const hash = window.location.hash;
    const id = requestAnimationFrame(() => {
      if (hash === "#portfolio") showPortfolio();
      else if (hash === "#boost") document.getElementById("boost")?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Side column: meta + links */}
      <aside className="order-2 grid content-start gap-3 text-sm lg:order-1 lg:pt-2">
        <p className="text-muted-foreground">{t("joined", { days })}</p>
        {who(c) && <p>{who(c)}</p>}
        <p className="flex items-center gap-2.5">
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground"
          />
          {known(CITIES, c.city) ? tt(`cities.${c.city}`) : c.city}
        </p>
        {c.creator_socials.map((s) => (
          <a
            key={s.network}
            href={SOCIAL_URL[s.network](s.handle)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-2.5 hover:underline"
          >
            <HugeiconsIcon
              icon={NETWORK_ICON[s.network]}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
            {s.network === "instagram" ? s.handle : `@${s.handle}`}
          </a>
        ))}
        <Link
          href="/me/profile#socials"
          className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          {c.creator_socials.length ? t("editLinks") : t("addLinks")}
        </Link>

        <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-5">
          <p className="text-xs font-medium text-muted-foreground">{t("termsTitle")}</p>
          <div className="flex flex-wrap gap-1.5">
            <DealTerms creator={c} />
          </div>
        </div>

        {c.categories.length > 0 && (
          <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-5">
            <p className="text-xs font-medium text-muted-foreground">{t("categoriesTitle")}</p>
            <ClampedChips>
              {normalizeCategories(c.categories).map((cat) => (
                <Badge key={cat} variant="brand">
                  <CategoryIcon category={cat} className="size-3.5" />
                  {tt(`categories.${cat}`)}
                </Badge>
              ))}
            </ClampedChips>
          </div>
        )}

        {/* Where they film: same block as on the public profile. */}
        {c.shoot_options.length > 0 && (
          <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-5">
            <p className="text-xs font-medium text-muted-foreground">{tp("tagsTitle")}</p>
            <ClampedChips>
              <CreatorTags creator={c} bare />
            </ClampedChips>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="order-1 grid min-w-0 grid-cols-1 content-start gap-6 lg:order-2">
        <PhoneHeader creator={c} onAddBio={() => setSheet("about")} />
        <section className="hidden gap-5 sm:flex sm:flex-row sm:items-center">
          <NamedAvatar
            name={c.display_name}
            src={c.avatar_url}
            className="size-28"
            fallbackClassName="text-3xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                {c.display_name}
              </h1>
              <StatusMark status={c.review_status} />
            </div>
            {c.bio ? (
              <p className="mt-2 max-w-xl text-pretty">{c.bio}</p>
            ) : (
              <button
                type="button"
                onClick={() => setSheet("about")}
                className="mt-2 inline-block text-primary hover:underline"
              >
                {t("addBio")}
              </button>
            )}
            <ProfileStatsLine creator={c} />
          </div>
          <HeaderActions creator={c} />
        </section>

        {/* Pending without a portfolio item isn't in review yet: the card says what to add instead. */}
        {(c.review_status === "rejected" ||
          (c.review_status === "pending" && c.portfolio_items.length > 0)) && (
          <StatusNote status={c.review_status} />
        )}

        <BoostCard creator={c} onPortfolio={showPortfolio} onOpen={setSheet} />
        <SectionSheet creator={c} section={sheet} onClose={() => setSheet(null)} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="portfolio">{t("tabs.portfolio")}</TabsTrigger>
            <TabsTrigger value="applications">{t("tabs.applications")}</TabsTrigger>
          </TabsList>
          <TabsContent value="portfolio" className="pt-3">
            <Panel
              id="portfolio"
              className={cn(
                "scroll-mt-24 [transition:box-shadow_300ms_ease]",
                flash && "ring-2 ring-primary dark:ring-primary",
              )}
            >
              <PortfolioSummary creator={c} className="mb-5 border-b border-border/70 pb-5" />
              <PortfolioEditor items={c.portfolio_items} creator={c} />
            </Panel>
          </TabsContent>
          <TabsContent value="applications" className="pt-3">
            <Panel className="py-10 text-center">
              <p className="font-medium">{t("applicationsEmpty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("boardBody")}</p>
              <Button
                className="mt-4"
                variant="outline"
                nativeButton={false}
                render={<Link href="/campaigns" />}
              >
                {t("boardTitle")}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Panel({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.05] sm:p-6 dark:ring-white/[0.07]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatusMark({ status }: { status: MyCreator["review_status"] }) {
  const t = useTranslations("creator.dashboard.status");
  if (status === "approved") {
    return (
      <span title={t("approved.title")} className="text-mint-ink">
        <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-6" />
        <span className="sr-only">{t("approved.title")}</span>
      </span>
    );
  }
  return (
    <Badge variant={status === "pending" ? "sun" : "rose"}>
      {status === "pending" && <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />}
      {t(`${status}.badge`)}
    </Badge>
  );
}

function StatusNote({ status }: { status: "pending" | "rejected" }) {
  const t = useTranslations("creator.dashboard.status");
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 text-sm",
        status === "pending" ? "text-muted-foreground" : "text-destructive",
      )}
    >
      <HugeiconsIcon
        icon={status === "pending" ? Clock01Icon : Alert02Icon}
        strokeWidth={2}
        className="mt-0.5 size-4 shrink-0"
      />
      {t(`${status}.body`)}
    </p>
  );
}

const ACTION =
  "inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary [&_svg]:size-4";

/** Top-right of the profile: edit, and share the public link (share sheet on phones, copy on computers). */
function HeaderActions({ creator }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const { share, copied } = useShareProfile(creator);

  return (
    <div className="flex items-center gap-5 self-start sm:pt-2">
      <button type="button" onClick={share} className={ACTION}>
        <HugeiconsIcon icon={copied ? Tick02Icon : Share08Icon} strokeWidth={2} />
        <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
      </button>
      <Link href="/me/profile" className={ACTION}>
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        {t("edit")}
      </Link>
    </div>
  );
}

/** Share the public link: the share sheet on phones, copy (with a short "Kopyalandı") on computers. */
function useShareProfile(creator: MyCreator) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/${locale}/creator/${creator.handle}`;
    const result = await shareOrCopy({ title: creator.display_name, url });
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else if (result === "failed") toast.error(t("copyFailed"));
  };
  return { share, copied };
}

/**
 * Phones: the Instagram-style profile head. Photo with the numbers beside it, then name, status
 * and bio, then two equal buttons. From `sm` up the wider row layout takes over.
 */
function PhoneHeader({ creator: c, onAddBio }: { creator: MyCreator; onAddBio: () => void }) {
  const t = useTranslations("creator.dashboard");
  const { share, copied } = useShareProfile(c);
  const button =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-muted px-3 text-sm font-semibold outline-none select-none [transition:scale_160ms_var(--ease-out),background-color_150ms_ease] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)]";
  return (
    <section className="grid gap-3 sm:hidden">
      <div className="flex items-center gap-4">
        <NamedAvatar
          name={c.display_name}
          src={c.avatar_url}
          className="size-20"
          fallbackClassName="text-2xl"
        />
        <PhoneStats creator={c} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-[-0.025em] text-balance">{c.display_name}</h1>
          <StatusMark status={c.review_status} />
        </div>
        {c.bio ? (
          <p className="mt-1 text-sm text-pretty">{c.bio}</p>
        ) : (
          <button type="button" onClick={onAddBio} className="mt-1 text-sm text-primary hover:underline">
            {t("addBio")}
          </button>
        )}
        <SocialProblems creator={c} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/me/profile" className={button}>
          {t("edit")}
        </Link>
        <button type="button" onClick={share} className={button}>
          <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
        </button>
      </div>
    </section>
  );
}

/** Numbers beside the photo: followers per network (tap for the last check and refresh), works. */
function PhoneStats({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const cell = "flex flex-col items-center leading-tight";
  return (
    <div className="flex flex-1 items-center justify-around gap-2 text-center">
      {c.creator_socials.map((s) => {
        const n = socialNumbers(c, s);
        return (
          <FollowersMenu key={s.network} creator={c} stacked>
            <span className="flex items-center gap-1 text-base font-semibold tabular-nums">
              {socialFailed(c, s) ? "–" : compact.format(n.followers)}
            </span>
            <span className="text-sm text-muted-foreground">{t("followers")}</span>
          </FollowersMenu>
        );
      })}
      <span className={cell}>
        <span className="text-base font-semibold tabular-nums">{c.portfolio_items.length}</span>
        <span className="text-sm text-muted-foreground">{t("works")}</span>
      </span>
    </div>
  );
}

/** Checked and nothing came back (not found, private, or the providers failed). */
function socialFailed(c: MyCreator, s: MyCreator["creator_socials"][number]) {
  return (
    !socialNumbers(c, s).checked &&
    !!c.creator_social_stats?.some(
      (x) => x.network === s.network && x.handle.toLowerCase() === s.handle.toLowerCase() && !x.fetched_at,
    )
  );
}

/** "@handle hesabını tapa bilmədik · Düzəlt" for each account the check couldn't find. */
function SocialProblems({ creator: c, className }: { creator: MyCreator; className?: string }) {
  const t = useTranslations("creator.dashboard");
  const failed = c.creator_socials.filter((s) => socialFailed(c, s));
  if (!failed.length) return null;
  return (
    <div className={cn("grid gap-1 text-sm", className)}>
      {failed.map((s) => (
        <p key={s.network} className="flex flex-wrap items-center gap-x-1.5 text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5" />
          {t("socialNotFound", { handle: s.handle })}
          <Link href="/me/profile#socials" className="font-medium underline underline-offset-4">
            {t("socialFix")}
          </Link>
        </p>
      ))}
    </div>
  );
}

/** Followers figure that opens a small menu: last check time and the refresh action. */
function FollowersMenu({
  creator: c,
  children,
  stacked,
}: {
  creator: MyCreator;
  children: React.ReactNode;
  /** Phone stats: number over label, no refresh icon (the menu still opens on tap). */
  stacked?: boolean;
}) {
  const t = useTranslations("creator.dashboard");
  const te = useTranslations();
  const refresh = useRefreshSocialStats();
  const checkedAt = c.creator_social_stats
    ?.map((s) => s.fetched_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  // Fixed dd.mm.yyyy hh:mm: Intl has thin Azerbaijani date data ("2026 M11 12").
  const when = checkedAt ? formatDateTime(new Date(checkedAt)) : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/25 aria-expanded:bg-muted",
          stacked
            ? "flex flex-col items-center rounded-xl px-2 py-1 leading-tight"
            : "-mx-1.5 -my-0.5 inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5",
        )}
      >
        {children}
        {!stacked && (
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className={cn("size-3", refresh.isPending && "animate-spin")}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-72 p-1.5">
        <div className="px-3 pt-2 pb-2.5 text-xs text-muted-foreground">
          <p className="text-pretty">{t("statsRefreshHint")}</p>
          <p className="mt-1.5 tabular-nums">{when ? `${t("statsLastRun")}: ${when}` : t("statsNeverRun")}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={refresh.isPending}
          onClick={() =>
            refresh.mutate(undefined, {
              onSuccess: () => toast.success(t("statsRefreshed")),
              onError: (e) => {
                const key = e instanceof ApiClientError ? e.message : "errors.unknown";
                toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
              },
            })
          }
        >
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          {refresh.isPending ? t("statsRefreshing") : t("statsRefresh")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** One small line under the bio: followers (✓ when checked) · portfolio items. */
function ProfileStatsLine({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {c.creator_socials.map((s) => {
        const n = socialNumbers(c, s);
        // Checked and nothing came back (not found, private, or the providers failed): say so and
        // let the creator fix the username. Setup stays silent about it on purpose.
        if (socialFailed(c, s))
          return (
            <span key={s.network} className="inline-flex flex-wrap items-center gap-x-1.5 text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5" />
              {t("socialNotFound", { handle: s.handle })}
              <Link href="/me/profile#socials" className="font-medium underline underline-offset-4">
                {t("socialFix")}
              </Link>
            </span>
          );
        return (
          <FollowersMenu key={s.network} creator={c}>
            <HugeiconsIcon icon={NETWORK_ICON[s.network]} strokeWidth={2} className="size-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{compact.format(n.followers)}</span>
            {t("followers")}
          </FollowersMenu>
        );
      })}
      <span className="whitespace-nowrap">
        <span className="font-semibold text-foreground tabular-nums">{c.portfolio_items.length}</span>{" "}
        {t("works")}
      </span>
    </div>
  );
}

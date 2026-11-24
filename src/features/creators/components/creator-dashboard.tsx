"use client";

import {
  Alert02Icon,
  Add01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
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
import { cn } from "@/lib/utils";
import { CITIES, CREATOR_CATEGORIES } from "@/schemas";
import { completeness } from "../form";
import { type MyCreator, socialNumbers, useMyCreator, useRefreshSocialStats } from "../hooks";
import { DealTerms } from "./deal-terms";
import { PortfolioEditor } from "./portfolio-editor";
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
  const tt = useTranslations("taxonomy");
  const who = useCreatorWho();
  const [now] = useState(() => Date.now());
  const days = Math.max(0, Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000));

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Side column: meta + links */}
      <aside className="order-2 grid content-start gap-3 text-sm lg:order-1 lg:pt-2">
        <p className="text-muted-foreground">{t("joined", { days })}</p>
        {who(c) && <p>{who(c)}</p>}
        <p className="flex items-center gap-2.5">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          {known(CITIES, c.city) ? tt(`cities.${c.city}`) : c.city}
          {c.languages.length > 0 && (
            <span className="text-muted-foreground">
              · {c.languages.map((l) => l.toUpperCase()).join(" ")}
            </span>
          )}
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
            <div className="flex flex-wrap gap-1.5">
              {c.categories.map((cat) => (
                <Badge key={cat} variant="brand">
                  {known(CREATOR_CATEGORIES, cat) ? tt(`categories.${cat}`) : cat}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="order-1 grid min-w-0 grid-cols-1 content-start gap-6 lg:order-2">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
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
            <p className="mt-1 text-muted-foreground">@{c.handle}</p>
            {c.bio ? (
              <p className="mt-2 max-w-xl text-pretty">{c.bio}</p>
            ) : (
              <Link href="/me/profile#about" className="mt-2 inline-block text-primary hover:underline">
                {t("addBio")}
              </Link>
            )}
            <ProfileStatsLine creator={c} />
          </div>
          <HeaderActions />
        </section>

        {c.review_status !== "approved" && <StatusNote status={c.review_status} />}

        <Overview creator={c} />

        <Tabs defaultValue="portfolio">
          <TabsList>
            <TabsTrigger value="portfolio">{t("tabs.portfolio")}</TabsTrigger>
            <TabsTrigger value="applications">{t("tabs.applications")}</TabsTrigger>
          </TabsList>
          <TabsContent value="portfolio" className="pt-3">
            <Panel>
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

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
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

/** Audience numbers, completeness and the share link in one card (Luhive's "Activity" spot). */
function Overview({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const { items } = completeness(c);
  // Portfolio has its own empty slots in the Portfolio tab.
  const todo = items.filter((i) => !i.done && i.key !== "portfolio");

  return (
    <Panel className="grid grid-cols-1 gap-5">
      {todo.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {todo.map((i) => (
            <Link
              key={i.key}
              href={i.section === "portfolio" ? "/me" : `/me/profile#${i.section}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)]"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
              {t(`checklist.${i.key}`)}
            </Link>
          ))}
        </div>
      )}

      <ShareRow creator={c} />
    </Panel>
  );
}

function ShareRow({ creator }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === "undefined" ? "" : `${window.location.origin}/${locale}/creator/${creator.handle}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ title: creator.display_name, url }).catch(() => {});
    else await copy();
  };

  return (
    <div className="grid grid-cols-1 gap-2 not-first:border-t not-first:border-border/70 not-first:pt-4">
      <p className="text-sm text-muted-foreground">
        {creator.review_status === "approved" ? t("shareBody") : t("sharePending")}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted py-1 pr-1 pl-4">
          <span className="min-w-0 flex-1 truncate text-sm" title={url}>
            {url.replace(/^https?:\/\//, "")}
          </span>
          <Button size="sm" variant="outline" onClick={copy}>
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
            <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
          </Button>
        </div>
        <Button size="icon" variant="soft" onClick={share} aria-label={t("share")}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

function HeaderActions() {
  const t = useTranslations("creator.dashboard");
  return (
    <Link
      href="/me/profile"
      className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground transition-colors hover:text-primary sm:pt-2 [&_svg]:size-4"
    >
      <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
      {t("edit")}
    </Link>
  );
}

/** Followers figure that opens a small menu: last check time and the refresh action. */
function FollowersMenu({ creator: c, children }: { creator: MyCreator; children: React.ReactNode }) {
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
      <DropdownMenuTrigger className="-mx-1.5 -my-0.5 inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/25 aria-expanded:bg-muted">
        {children}
        <HugeiconsIcon
          icon={RefreshIcon}
          strokeWidth={2}
          className={cn("size-3", refresh.isPending && "animate-spin")}
        />
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

/** One small line under the bio: followers (✓ when checked) · portfolio items · completeness. */
function ProfileStatsLine({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const { percent } = completeness(c);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {c.creator_socials.map((s) => {
        const n = socialNumbers(c, s);
        return (
          <FollowersMenu key={s.network} creator={c}>
            <HugeiconsIcon icon={NETWORK_ICON[s.network]} strokeWidth={2} className="size-3.5" />
            <span className="font-semibold text-foreground tabular-nums">{compact.format(n.followers)}</span>
            {t("followers")}
            {n.checked && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-3.5 text-mint-ink"
                aria-label={t("checked")}
              />
            )}
          </FollowersMenu>
        );
      })}
      <span className="whitespace-nowrap">
        <span className="font-semibold text-foreground tabular-nums">{c.portfolio_items.length}</span>{" "}
        {t("works")}
      </span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="font-semibold text-foreground tabular-nums">{percent}%</span>
        {t("completeShort")}
        <span
          className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("completeTitle")}
        >
          <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </span>
      </span>
    </div>
  );
}

"use client";

import {
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
import { useState } from "react";
import { toast } from "sonner";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CITIES, CREATOR_CATEGORIES, PRICE_FORMATS } from "@/schemas";
import { completeness } from "../form";
import { type MyCreator, socialNumbers, useMyCreator, useRefreshSocialStats } from "../hooks";
import { PortfolioEditor } from "./portfolio-editor";
import { SetupPrompt } from "./setup-prompt";
import { NETWORK_ICON } from "./profile-sections";

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
  const { data, isPending, isError } = useMyCreator();
  if (isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <Home creator={data} /> : <SetupPrompt />;
}

function Home({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const tt = useTranslations("taxonomy");
  const [now] = useState(() => Date.now());
  const days = Math.max(0, Math.floor((now - new Date(c.created_at).getTime()) / 86_400_000));

  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Side column: meta + links */}
      <aside className="order-2 grid content-start gap-3 text-sm lg:order-1 lg:pt-2">
        <p className="text-muted-foreground">{t("joined", { days })}</p>
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

        {(c.categories.length > 0 || c.barter_open) && (
          <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-5">
            <p className="text-xs font-medium text-muted-foreground">{t("categoriesTitle")}</p>
            <div className="flex flex-wrap gap-1.5">
              {c.barter_open && <Badge variant="mint">{tt("barter")}</Badge>}
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
          </div>
          <Button
            variant="outline"
            className="self-start"
            nativeButton={false}
            render={<Link href="/me/profile" />}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
            {t("edit")}
          </Button>
        </section>

        {c.review_status !== "approved" && <StatusNote status={c.review_status} />}

        <Overview creator={c} />

        <Tabs defaultValue="portfolio">
          <TabsList>
            <TabsTrigger value="portfolio">{t("tabs.portfolio")}</TabsTrigger>
            <TabsTrigger value="prices">{t("tabs.prices")}</TabsTrigger>
            <TabsTrigger value="applications">{t("tabs.applications")}</TabsTrigger>
          </TabsList>
          <TabsContent value="portfolio" className="pt-3">
            <Panel>
              <PortfolioEditor items={c.portfolio_items} creator={c} />
            </Panel>
          </TabsContent>
          <TabsContent value="prices" className="pt-3">
            <Prices creator={c} />
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
        "rounded-2xl px-4 py-3 text-sm",
        status === "pending" ? "bg-sun/70 text-sun-ink" : "bg-rose text-rose-ink",
      )}
    >
      {" "}
      {t(`${status}.body`)}
    </p>
  );
}

/** Audience numbers, completeness and the share link in one card (Luhive's "Activity" spot). */
function Overview({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const { items, percent } = completeness(c);
  const todo = items.filter((i) => !i.done);

  return (
    <Panel className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {c.creator_socials.map((s) => {
          const n = socialNumbers(c, s);
          return (
            <div key={s.network}>
              <p className="flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                {compact.format(n.followers)}
                {n.checked && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    className="size-4 text-mint-ink"
                    aria-label={t("checked")}
                  />
                )}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <HugeiconsIcon icon={NETWORK_ICON[s.network]} strokeWidth={2} className="size-3.5" />
                {t("followers")}
              </p>
            </div>
          );
        })}
        <div>
          <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{c.portfolio_items.length}</p>
          <p className="text-sm text-muted-foreground">{t("works")}</p>
        </div>
        <div className="min-w-40 flex-1 sm:max-w-56">
          <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{percent}%</p>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("completeTitle")}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("completeTitle")}</p>
        </div>
      </div>

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

      {c.creator_socials.length > 0 && <StatsRefresh creator={c} />}

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
    <div className="grid grid-cols-1 gap-2 border-t border-border/70 pt-4">
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

function Prices({ creator: c }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const money = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const prices = PRICE_FORMATS.flatMap((f) => c.creator_prices.filter((p) => p.format === f));
  return (
    <Panel>
      {prices.length ? (
        <ul className="divide-y divide-border/70">
          {prices.map((p) => (
            <li key={p.format} className="flex items-center justify-between py-3 first:pt-0">
              <span>{known(PRICE_FORMATS, p.format) ? tt(`formats.${p.format}`) : p.format}</span>
              <span className="font-medium tabular-nums">
                {money.format(Number(p.amount))} {p.currency}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("pricesEmpty")}</p>
      )}
      <Button
        className="mt-4"
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/me/profile#prices" />}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
        {t("editPrices")}
      </Button>
    </Panel>
  );
}

/** "Numbers checked automatically · 2h ago" + manual re-check (server rate-limits to 1/hour). */
function StatsRefresh({ creator: c }: { creator: MyCreator }) {
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <span>{when ? t("statsCheckedAt", { when }) : t("statsSelfReported")}</span>
      <Button
        size="sm"
        variant="ghost"
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
        <HugeiconsIcon
          icon={RefreshIcon}
          strokeWidth={2}
          data-icon="inline-start"
          className={cn(refresh.isPending && "animate-spin")}
        />
        {refresh.isPending ? t("statsRefreshing") : t("statsRefresh")}
      </Button>
    </div>
  );
}

function formatDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

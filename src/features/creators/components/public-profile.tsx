"use client";

import {
  ArrowUpRight01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Location01Icon,
  PencilEdit02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CITIES, CREATOR_CATEGORIES, PRICE_FORMATS } from "@/schemas";
import { type CreatorPublic, socialNumbers } from "../hooks";
import { shortUrl } from "./portfolio-editor";
import { NETWORK_ICON, NETWORK_TINT } from "./profile-sections";

const SOCIAL_URL = {
  instagram: (h: string) => `https://www.instagram.com/${h}/`,
  tiktok: (h: string) => `https://www.tiktok.com/@${h}`,
  youtube: (h: string) => `https://www.youtube.com/@${h}`,
} as const;

function PublicHeader() {
  const t = useTranslations("creator.public");
  const { data: me } = useMe();
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-4">
      <Link href="/" className="font-heading text-xl font-semibold tracking-[-0.04em]">
        ugc<span className="text-primary">market</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <LanguageMenu />
        {!me && (
          <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            {t("login")}
          </Button>
        )}
      </div>
    </header>
  );
}

export function PublicCreatorStatus({ kind }: { kind: "loading" | "notFound" }) {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        {kind === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">{t("errors.notFound.creator")}</h1>
            <p className="mt-2 text-muted-foreground">{t("creator.public.notFoundBody")}</p>
            <Button className="mt-6" variant="outline" nativeButton={false} render={<Link href="/" />}>
              {t("creator.public.home")}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}

export function PublicCreatorProfile({
  creator: c,
  isOwner,
  preview,
}: {
  creator: CreatorPublic;
  isOwner?: boolean;
  preview?: boolean;
}) {
  const t = useTranslations("creator.public");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const { data: me } = useMe();
  const money = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const known = <T extends string>(list: readonly T[], v: string): v is T =>
    (list as readonly string[]).includes(v);
  const prices = PRICE_FORMATS.flatMap((f) => c.creator_prices.filter((p) => p.format === f));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16">
        {preview && (
          <div
            role="status"
            className="mb-4 flex items-start gap-3 rounded-2xl bg-sun p-4 text-sm text-sun-ink"
          >
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            {c.review_status === "rejected" ? t("previewRejected") : t("previewPending")}
          </div>
        )}

        {/* Header */}
        <section className="rounded-[2rem] bg-card p-6 shadow-(--shadow-raised) ring-1 ring-foreground/[0.04] sm:p-8 dark:ring-white/[0.07]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <NamedAvatar
              name={c.display_name}
              src={c.avatar_url}
              className="size-24 sm:size-28"
              fallbackClassName="text-3xl"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                {c.display_name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                <span>@{c.handle}</span>
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
                  {known(CITIES, c.city) ? tt(`cities.${c.city}`) : c.city}
                </span>
                <span>{c.languages.map((l) => l.toUpperCase()).join(" · ")}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.barter_open && <Badge variant="mint">{t("barter")}</Badge>}
                {c.categories.map((cat) => (
                  <Badge key={cat} variant="brand">
                    {known(CREATOR_CATEGORIES, cat) ? tt(`categories.${cat}`) : cat}
                  </Badge>
                ))}
              </div>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                className="self-start"
                nativeButton={false}
                render={<Link href="/me/profile" />}
              >
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                {t("edit")}
              </Button>
            )}
          </div>
          {c.bio && <p className="mt-6 max-w-2xl leading-relaxed text-pretty whitespace-pre-line">{c.bio}</p>}
        </section>

        {/* Socials */}
        {c.creator_socials.length > 0 && (
          <section className="mt-4 grid gap-3 sm:grid-cols-3">
            {c.creator_socials.map((s) => (
              <a
                key={s.network}
                href={SOCIAL_URL[s.network](s.handle)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      NETWORK_TINT[s.network],
                    )}
                  >
                    <HugeiconsIcon icon={NETWORK_ICON[s.network]} strokeWidth={2} className="size-4" />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium">@{s.handle}</span>
                  {s.verified && (
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      strokeWidth={2}
                      className="size-4 text-primary"
                    />
                  )}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                    className="ml-auto size-4 text-muted-foreground"
                  />
                </div>
                <SocialCardNumbers creator={c} social={s} />
              </a>
            ))}
          </section>
        )}
        {c.creator_socials.some((s) => !socialNumbers(c, s).checked) && (
          <p className="mt-2 px-1 text-xs text-muted-foreground">{t("selfReported")}</p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_18rem]">
          {/* Portfolio */}
          <section className="rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-6">
            <h2 className="font-semibold tracking-[-0.02em]">{t("portfolio")}</h2>
            {c.portfolio_items.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {c.portfolio_items.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 transition-colors hover:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          NETWORK_TINT[p.network],
                        )}
                      >
                        <HugeiconsIcon icon={NETWORK_ICON[p.network]} strokeWidth={2} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {p.title || t(`networkPost.${p.network}`)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {shortUrl(p.url)}
                        </span>
                      </span>
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        strokeWidth={2}
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("portfolioEmpty")}</p>
            )}
          </section>

          {/* Prices + CTA */}
          <div className="grid content-start gap-4">
            <section className="rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-6">
              <h2 className="font-semibold tracking-[-0.02em]">{t("prices")}</h2>
              {prices.length ? (
                <dl className="mt-3 grid gap-2">
                  {prices.map((p) => (
                    <div key={p.format} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">
                        {known(PRICE_FORMATS, p.format) ? tt(`formats.${p.format}`) : p.format}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {money.format(Number(p.amount))} {p.currency}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{t("pricesEmpty")}</p>
              )}
            </section>
            {!isOwner && me?.role !== "creator" && (
              <section className="rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
                <h2 className="font-semibold tracking-[-0.02em]">{t("ctaTitle")}</h2>
                <p className="mt-1 text-sm text-primary-foreground/85">{t("ctaBody")}</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  nativeButton={false}
                  render={
                    <Link
                      href={
                        me?.role === "brand"
                          ? "/brand/campaigns/new"
                          : { pathname: "/signup", query: { role: "brand" } }
                      }
                    />
                  }
                >
                  {t("ctaButton")}
                </Button>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Followers + avg views for one account; automatically checked numbers get a label. */
function SocialCardNumbers({
  creator,
  social,
}: {
  creator: CreatorPublic;
  social: CreatorPublic["creator_socials"][number];
}) {
  const t = useTranslations("creator.public");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const n = socialNumbers(creator, social);
  return (
    <>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] tabular-nums">
        {compact.format(n.followers)}
      </p>
      <p className="text-sm text-muted-foreground">{t("followers")}</p>
      {n.avg_views != null && (
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
          {t("avgViews", { views: compact.format(n.avg_views) })}
        </p>
      )}
      {n.checked && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-mint-ink">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
          {t("checked")}
        </p>
      )}
    </>
  );
}

"use client";

import { CategoryIcon } from "@/components/shared/category-icon";
import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  Location01Icon,
  PencilEdit02Icon,
  Share08Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ClampedChips } from "@/components/shared/clamped-chips";
import { PublicHeader } from "@/components/shared/public-header";
import { LoadingState } from "@/components/shared/loading-state";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";
import { shareOrCopy } from "@/lib/share";
import { cn } from "@/lib/utils";
import { CITIES, normalizeCategories } from "@/schemas";
import { type CreatorPublic, portfolioSummary, socialNumbers } from "../hooks";
import { CreatorContactsDialog } from "./creator-contacts-dialog";
import { CreatorTags } from "./creator-tags";
import { PortfolioSummary } from "./portfolio-summary";
import { DealTerms } from "./deal-terms";
import { PortfolioEditor } from "./portfolio-editor";
import { NETWORK_ICON } from "./profile-sections";
import { useCreatorWho } from "../who";

const SOCIAL_URL = {
  instagram: (h: string) => `https://www.instagram.com/${h}/`,
  tiktok: (h: string) => `https://www.tiktok.com/@${h}`,
  youtube: (h: string) => `https://www.youtube.com/@${h}`,
} as const;

/** Same grid as PublicCreatorProfile (and /me): side meta column, header, portfolio panel. */
function ProfileSkeleton() {
  return (
    <LoadingState className="grid w-full grid-cols-1 gap-x-12 gap-y-8 text-left lg:grid-cols-[13rem_minmax(0,1fr)]">
      <div className="order-2 grid content-start gap-3.5 lg:order-1 lg:pt-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-3 w-16" />
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="mt-4 h-3 w-20" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="order-1 grid content-start gap-6 lg:order-2">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="size-28 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2.5">
            <Skeleton className="h-9 w-64 max-w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    </LoadingState>
  );
}

export function PublicCreatorStatus({ kind }: { kind: "loading" | "notFound" }) {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader className={WIDE_HEADER} />
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col px-4",
          kind === "loading"
            ? "max-w-5xl pt-6 pb-16 sm:pt-10"
            : "max-w-md items-center justify-center py-16 text-center",
        )}
      >
        {kind === "loading" ? (
          <ProfileSkeleton />
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

/** Same width as the signed-in app shell, so /me and the public page line up. */
const WIDE_HEADER = "mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-4";

/**
 * The public creator page. Built on the same layout as /me (side column with meta, header,
 * portfolio panel) so creators recognise their page; brands also get prices and a call to action,
 * and nothing is editable.
 */
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
  const td = useTranslations("creator.dashboard");
  const tt = useTranslations("taxonomy");
  const who = useCreatorWho();
  const locale = useLocale();
  const { data: me } = useMe();
  const [contactsOpen, setContactsOpen] = useState(false);
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const known = <T extends string>(list: readonly T[], v: string): v is T =>
    (list as readonly string[]).includes(v);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader className={WIDE_HEADER} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:pt-10">
        {preview && (
          <div role="status" className="mb-6 flex items-start gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
            {c.review_status === "rejected" ? t("previewRejected") : t("previewPending")}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          {/* Side column: who, where, links, terms, categories, tags (prices are not shown) */}
          <aside className="order-2 grid content-start gap-3 text-sm lg:order-1 lg:pt-2">
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
                {s.handle}
              </a>
            ))}

            <SideBlock title={td("termsTitle")}>
              <DealTerms creator={c} />
            </SideBlock>
            {c.categories.length > 0 && (
              <SideBlock title={td("categoriesTitle")} clamp>
                {normalizeCategories(c.categories).map((cat) => (
                  <Badge key={cat} variant="brand">
                    <CategoryIcon category={cat} className="size-3.5" />
                    {tt(`categories.${cat}`)}
                  </Badge>
                ))}
              </SideBlock>
            )}
            {c.shoot_options.length > 0 && (
              <SideBlock title={t("tagsTitle")} clamp>
                <CreatorTags creator={c} bare />
              </SideBlock>
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
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
                  {c.display_name}
                </h1>
                {c.bio && <p className="mt-2 max-w-xl text-pretty whitespace-pre-line">{c.bio}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {c.creator_socials.map((s) => {
                    const n = socialNumbers(c, s);
                    return (
                      <span key={s.network} className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={NETWORK_ICON[s.network]} strokeWidth={2} className="size-3.5" />
                        <span className="font-semibold text-foreground tabular-nums">
                          {compact.format(n.followers)}
                        </span>
                        {td("followers")}
                        {n.checked && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            strokeWidth={2}
                            className="size-3.5 text-mint-ink"
                            aria-label={td("checked")}
                          />
                        )}
                      </span>
                    );
                  })}
                  <span className="whitespace-nowrap">
                    <span className="font-semibold text-foreground tabular-nums">
                      {c.portfolio_items.length}
                    </span>{" "}
                    {td("works")}
                  </span>
                </div>
              </div>
              <PublicActions creator={c} isOwner={isOwner} />
            </section>

            {!isOwner && me?.role !== "creator" && (
              <section className="flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold tracking-[-0.02em]">{t("ctaTitle")}</h2>
                  <p className="mt-1 text-sm text-primary-foreground/85">{t("ctaBody")}</p>
                </div>
                {me?.role === "brand" ? (
                  <Button variant="secondary" className="shrink-0" onClick={() => setContactsOpen(true)}>
                    {t("ctaButton")}
                  </Button>
                ) : (
                  // Visitors: sign up as a brand first (the role is picked there).
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    nativeButton={false}
                    render={<Link href={{ pathname: "/signup", query: { role: "brand" } }} />}
                  >
                    {t("ctaButton")}
                  </Button>
                )}
              </section>
            )}

            <section className="rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.05] sm:p-6 dark:ring-white/[0.07]">
              <h2 className="font-semibold tracking-[-0.02em]">{t("portfolio")}</h2>
              {c.portfolio_items.length ? (
                <>
                  <PortfolioSummary creator={c} className="mt-4 mb-5 border-b border-border/70 pb-5" />
                  <div className={cn(!portfolioSummaryShown(c) && "mt-4")}>
                    <PortfolioEditor items={c.portfolio_items} creator={c} readOnly />
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{t("portfolioEmpty")}</p>
              )}
            </section>
          </div>
        </div>
      </main>
      <CreatorContactsDialog
        handle={c.handle}
        name={c.display_name}
        open={contactsOpen}
        onOpenChange={setContactsOpen}
      />
    </div>
  );
}

const portfolioSummaryShown = (c: CreatorPublic) => portfolioSummary(c) != null;

function SideBlock({
  title,
  children,
  clamp,
}: {
  title: string;
  children: React.ReactNode;
  /** Long chip lists: two lines, then "Daha çox". */
  clamp?: boolean;
}) {
  return (
    <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {clamp ? (
        <ClampedChips>{children}</ClampedChips>
      ) : (
        <div className="flex flex-wrap gap-1.5">{children}</div>
      )}
    </div>
  );
}

/** Top-right, like /me: share for everyone (copy on computers), edit for the owner. */
function PublicActions({ creator, isOwner }: { creator: CreatorPublic; isOwner?: boolean }) {
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
  const action =
    "inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary [&_svg]:size-4";
  return (
    <div className="flex items-center gap-5 self-start sm:pt-2">
      <button type="button" onClick={share} className={action}>
        <HugeiconsIcon icon={copied ? Tick02Icon : Share08Icon} strokeWidth={2} />
        <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
      </button>
      {isOwner && (
        <Link href="/me/profile" className={action}>
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
          {t("edit")}
        </Link>
      )}
    </div>
  );
}

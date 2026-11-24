"use client";

import {
  Calendar03Icon,
  InstagramIcon,
  Location01Icon,
  LockIcon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CITIES, CREATOR_CATEGORIES } from "@/schemas";

export type ListingCardData = {
  title: string;
  brand: { name: string; logo_url: string | null };
  category: string | null | undefined;
  deliverables: { format: string; count: number }[];
  compensation_type: string;
  /** "post" or "ugc"; missing in the create-form preview before formats are picked. */
  collaboration_model?: string | null;
  compensation_value: number | null;
  /** Barter: what the brand offers (e.g. "breakfast for two"). */
  compensation_details?: string | null;
  currency: string;
  city: string | null;
  deadline: string | null;
  min_followers: number;
  creators_needed?: number;
  /** ISO time: "New" for 48 hours after publishing. */
  published_at?: string | null;
  /** Set when the server left the pay out (signed out, or another brand's listing). */
  pay_hidden?: "signed_out" | "brand" | null;
  /** Creator already applied. */
  applied?: boolean;
  /** The viewing brand's own listing. */
  mine?: boolean;
};

const DAY = 86_400_000;

/** Whole days from today (local calendar) to a YYYY-MM-DD deadline. 0 = last day. */
export function daysLeft(deadline: string, now = new Date()) {
  const [y, m, d] = deadline.split("-").map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY);
}

export const isNew = (publishedAt: string | null | undefined, now = Date.now()) =>
  !!publishedAt && now - new Date(publishedAt).getTime() < 2 * DAY;

const known = <T extends string>(list: readonly T[], v: string | null | undefined): v is T =>
  !!v && (list as readonly string[]).includes(v);

/** A listing as creators see it on the board. Also the live preview in the create form. */
export function ListingCard({ data: d, className }: { data: ListingCardData; className?: string }) {
  const t = useTranslations("campaign.card");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  const left = d.deadline ? daysLeft(d.deadline) : null;

  return (
    <article className={cn("rounded-3xl bg-card p-5 shadow-(--shadow-raised)", className)}>
      <div className="flex items-center gap-3">
        <NamedAvatar name={d.brand.name || "?"} src={d.brand.logo_url} square className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-[-0.02em]">{d.brand.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {known(CREATOR_CATEGORIES, d.category) ? tt(`categories.${d.category}`) : t("noCategory")}
          </p>
        </div>
        {/* One mark at most, by what matters to this viewer: theirs, done, then fresh. */}
        {d.mine ? (
          <Badge variant="brand" className="shrink-0">
            {t("mine")}
          </Badge>
        ) : d.applied ? (
          <Badge variant="mint" className="shrink-0">
            {t("applied")}
          </Badge>
        ) : isNew(d.published_at) ? (
          <Badge variant="sun" className="shrink-0">
            {t("new")}
          </Badge>
        ) : null}
      </div>

      <h3
        className={cn(
          "mt-4 text-lg leading-snug font-semibold tracking-[-0.02em] break-words",
          !d.title && "text-muted-foreground",
        )}
      >
        {d.title || t("noTitle")}
      </h3>

      <TypeBadges data={d} className="mt-2.5" />

      {d.pay_hidden ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-4 shrink-0" />
          {d.pay_hidden === "brand" ? t("payCreators") : t("payLogin")}
        </p>
      ) : (
        <Pay data={d} />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {d.deliverables.map((x, i) => (
          <Badge key={x.format} variant="sky">
            {i === 0 && <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} />}
            {tt(`formats.${x.format}` as never)}
            {x.count > 1 && <span className="tabular-nums">× {x.count}</span>}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 pt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
          {known(CITIES, d.city) ? tt(`cities.${d.city}`) : t("anyCity")}
        </span>
        {d.min_followers > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
            {t("minFollowers", { count: compact.format(d.min_followers) })}
          </span>
        )}
        {d.creators_needed !== undefined && d.creators_needed > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="size-4" />
            {t("creatorsNeeded", { count: d.creators_needed })}
          </span>
        )}
        {left !== null && left >= 0 && (
          <span className={cn("flex items-center gap-1.5 tabular-nums", left <= 2 && "text-foreground")}>
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
            {t("daysLeft", { count: left })}
          </span>
        )}
      </div>
    </article>
  );
}

/**
 * The pay is what creators scan for first, so it is the card's big figure: the amount for paid
 * listings (plus any product/service on top), the word plus what's offered for barter or bid
 * (with the bid ceiling, if any). Unpaid and "amount not set yet" stay quiet.
 */
export function formatAmount(value: number, locale: string) {
  // az/ru group with a space ("1 200"); browsers often lack az number data and fall back to
  // English commas, so az borrows ru formatting.
  return new Intl.NumberFormat(locale === "en" ? "en" : "ru", { maximumFractionDigits: 2 }).format(value);
}

export function Pay({
  data: d,
}: {
  data: Pick<
    ListingCardData,
    "compensation_type" | "compensation_value" | "compensation_details" | "currency"
  >;
}) {
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const big = "text-3xl font-semibold tracking-[-0.035em]";

  if (d.compensation_type === "money" && d.compensation_value) {
    const amount = formatAmount(d.compensation_value, locale);
    return (
      <div className="mt-3">
        <p className={cn("tabular-nums", big)}>
          {amount}
          <span className="ml-1.5 text-base font-medium tracking-normal text-muted-foreground">
            {d.currency}
          </span>
        </p>
        {d.compensation_details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-pretty text-muted-foreground">
            + {d.compensation_details}
          </p>
        )}
      </div>
    );
  }
  const label = tt(`compensation.${d.compensation_type}` as never);
  if (d.compensation_type === "bid")
    return (
      <div className="mt-3">
        <p className={big}>{label}</p>
        {d.compensation_value ? (
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {tt("bidUpTo", { amount: formatAmount(d.compensation_value, locale), currency: d.currency })}
          </p>
        ) : null}
        {d.compensation_details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-pretty text-muted-foreground">
            + {d.compensation_details}
          </p>
        )}
      </div>
    );
  if (d.compensation_type === "barter")
    return (
      <div className="mt-3">
        <p className={big}>{label}</p>
        {d.compensation_details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-pretty text-muted-foreground">
            {d.compensation_details}
          </p>
        )}
      </div>
    );
  return <p className={cn("mt-3 text-muted-foreground", big)}>{label}</p>;
}

/**
 * What kind of deal it is, readable before the pay: payment type (paid, bid, barter, unpaid) and
 * where the content goes (the creator's account or the brand only). Shown even when pay is hidden.
 */
export function TypeBadges({
  data: d,
  className,
}: {
  data: Pick<ListingCardData, "compensation_type" | "collaboration_model">;
  className?: string;
}) {
  const tt = useTranslations("taxonomy");
  const collab =
    d.collaboration_model === "post" || d.collaboration_model === "ugc" ? d.collaboration_model : null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Badge variant="mint">{tt(`compensation.${d.compensation_type}` as never)}</Badge>
      {collab && <Badge variant="rose">{tt(`collaboration.${collab}`)}</Badge>}
    </div>
  );
}

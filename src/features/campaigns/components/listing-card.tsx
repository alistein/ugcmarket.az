"use client";

import {
  ChartColumnIcon,
  Clock01Icon,
  Location01Icon,
  LockIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BRAND_CATEGORIES, CITIES, type GiftType } from "@/schemas";

export type ListingCardData = {
  title: string;
  /** Brand's own category (what the brand does), shown under its name. */
  brand: { name: string; logo_url: string | null; category?: string | null };
  category: string | null | undefined;
  deliverables: { format: string; count: number }[];
  compensation_type: string;
  compensation_value: number | null;
  /** What exactly is given (barter offer, or the gift on top). */
  compensation_details?: string | null;
  /** A product or service on top of the pay; "none" shows nothing. */
  gift_type?: GiftType | null;
  currency: string;
  city: string | null;
  deadline: string | null;
  min_followers: number;
  creators_needed?: number;
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

const known = <T extends string>(list: readonly T[], v: string | null | undefined): v is T =>
  !!v && (list as readonly string[]).includes(v);

const hasGift = (g: GiftType | null | undefined): g is "product" | "service" =>
  g === "product" || g === "service";

/**
 * A listing as creators see it on the board. Also the live preview in the create form.
 * Layout from the founders' mockup (2026-11-26): brand + one status pill, title, meta row,
 * formats, then the pay panel.
 */
export function ListingCard({ data: d, className }: { data: ListingCardData; className?: string }) {
  const t = useTranslations("campaign.card");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  const left = d.deadline ? daysLeft(d.deadline) : null;
  // The pill always shows time left (founders, 2026-11-26: no "mine" / "applied" marks here).
  const showDeadline = left !== null && left >= 0;

  return (
    <article
      className={cn(
        "flex aspect-square flex-col overflow-hidden rounded-[1.375rem] bg-card p-4 shadow-(--shadow-raised) *:shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <NamedAvatar name={d.brand.name || "?"} src={d.brand.logo_url} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[-0.01em]">{d.brand.name}</p>
          {known(BRAND_CATEGORIES, d.brand.category) && (
            <p className="truncate text-xs text-muted-foreground">
              {tt(`brandCategories.${d.brand.category}`)}
            </p>
          )}
        </div>
        {showDeadline && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            {t("daysLeft", { count: left })}
          </span>
        )}
      </div>

      <h3
        className={cn(
          "mt-2.5 truncate text-lg leading-tight font-semibold tracking-[-0.02em]",
          !d.title && "text-muted-foreground",
        )}
      >
        {d.title || t("noTitle")}
      </h3>

      <div className="mt-2 flex items-center gap-x-3 overflow-hidden text-xs whitespace-nowrap text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
          {known(CITIES, d.city) ? tt(`cities.${d.city}`) : t("anyCity")}
        </span>
        {d.min_followers > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <HugeiconsIcon icon={ChartColumnIcon} strokeWidth={2} className="size-3.5" />
            {t("minFollowers", { count: compact.format(d.min_followers) })}
          </span>
        )}
        {d.creators_needed !== undefined && d.creators_needed > 0 && (
          <span className="flex items-center gap-1.5 tabular-nums">
            <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="size-3.5" />
            {t("creatorsNeeded", { count: d.creators_needed })}
          </span>
        )}
      </div>

      {d.deliverables.length > 0 && (
        <>
          <p className="mt-2.5 text-xs text-muted-foreground">{t("formatsLabel")}</p>
          <ul className="mt-1.5 flex gap-1.5 overflow-hidden">
            {d.deliverables.map((x) => (
              <li key={x.format} className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {tt(`formats.${x.format}` as never)}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Grows in a stretched grid cell, so pay panels line up across a row. */}
      <div className="min-h-2.5 flex-1" />
      <PayPanel data={d} />
    </article>
  );
}

/**
 * The pay is the card's anchor (founders' mockup, D1/D2): a grey panel with the figure in coral,
 * the gift on the right and what exactly is given under a hairline.
 */
function PayPanel({ data: d }: { data: ListingCardData }) {
  const t = useTranslations("campaign.card");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const amount = d.compensation_type === "money" && !d.pay_hidden && d.compensation_value;
  const value = amount
    ? `${formatAmount(d.compensation_value as number, locale)} ${d.currency}`
    : tt(`compensation.${d.compensation_type}` as never);
  const details = !d.pay_hidden && d.compensation_details?.trim();

  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{t("payLabel")}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-x-3">
        <p className="min-w-0 truncate text-2xl leading-7 font-semibold tracking-[-0.03em] text-primary tabular-nums">
          {value}
        </p>
        {hasGift(d.gift_type) && (
          <p className="shrink-0 text-xs font-medium text-primary">{t(`gift.${d.gift_type}`)}</p>
        )}
      </div>
      {d.pay_hidden ? (
        <p className="mt-2 flex items-center gap-1.5 truncate border-t border-border pt-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-3.5 shrink-0" />
          {d.pay_hidden === "brand" ? t("payCreators") : t("payLogin")}
        </p>
      ) : (
        details && (
          <p className="mt-2 line-clamp-1 border-t border-border pt-2 text-xs break-words text-muted-foreground">
            {details}
          </p>
        )
      )}
    </div>
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
    "compensation_type" | "compensation_value" | "compensation_details" | "gift_type" | "currency"
  >;
}) {
  const tt = useTranslations("taxonomy");
  const t = useTranslations("campaign.card");
  const locale = useLocale();
  const big = "text-3xl font-semibold tracking-[-0.035em]";
  const gift = hasGift(d.gift_type) && (
    <p className="mt-0.5 text-sm font-medium text-primary">{t(`gift.${d.gift_type}`)}</p>
  );

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
        {gift}
        {d.compensation_details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-pretty text-muted-foreground">
            {d.compensation_details}
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
        {gift}
        {d.compensation_details && (
          <p className="mt-0.5 line-clamp-2 text-sm text-pretty text-muted-foreground">
            {d.compensation_details}
          </p>
        )}
      </div>
    );
  if (d.compensation_type === "barter")
    return (
      <div className="mt-3">
        <p className={big}>{label}</p>
        {gift}
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
 * What kind of deal it is, readable before the pay: payment type (paid, bid, barter, unpaid).
 * Shown even when pay is hidden.
 */
export function TypeBadges({
  data: d,
  className,
}: {
  data: Pick<ListingCardData, "compensation_type">;
  className?: string;
}) {
  const tt = useTranslations("taxonomy");
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <Badge variant="mint">{tt(`compensation.${d.compensation_type}` as never)}</Badge>
    </div>
  );
}

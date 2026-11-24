"use client";

import { Calendar03Icon, InstagramIcon, Location01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
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
  compensation_value: number | null;
  /** Barter: what the brand offers (e.g. "breakfast for two"). */
  compensation_details?: string | null;
  currency: string;
  city: string | null;
  deadline: string | null;
  min_followers: number;
};

const known = <T extends string>(list: readonly T[], v: string | null | undefined): v is T =>
  !!v && (list as readonly string[]).includes(v);

/** A listing as creators see it on the board. Also the live preview in the create form. */
export function ListingCard({ data: d, className }: { data: ListingCardData; className?: string }) {
  const t = useTranslations("campaign.card");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  // DD.MM.YYYY: browsers often lack Azerbaijani month names (they print "M12"), and this is
  // how dates are written in Azerbaijan and Russia anyway.
  const deadline = d.deadline ? d.deadline.split("-").reverse().join(".") : null;

  return (
    <article className={cn("rounded-3xl bg-card p-5 shadow-(--shadow-raised)", className)}>
      <div className="flex items-center gap-3">
        <NamedAvatar name={d.brand.name || "?"} src={d.brand.logo_url} square className="size-11" />
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-[-0.02em]">{d.brand.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {known(CREATOR_CATEGORIES, d.category) ? tt(`categories.${d.category}`) : t("noCategory")}
          </p>
        </div>
      </div>

      <h3
        className={cn(
          "mt-4 text-lg leading-snug font-semibold tracking-[-0.02em] break-words",
          !d.title && "text-muted-foreground",
        )}
      >
        {d.title || t("noTitle")}
      </h3>

      <Pay data={d} />

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
        {deadline && (
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
            {t("deadline", { date: deadline })}
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

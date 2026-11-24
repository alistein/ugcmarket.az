"use client";

import { useLocale, useTranslations } from "next-intl";
import { InfoTip } from "@/components/shared/info-tip";
import { type CreatorPublic, portfolioSummary } from "../hooks";

/**
 * Portfolio at a glance: four numbers a brand reads before opening any Reel. Built from the
 * creator's own checked posts only; hidden until at least one has numbers.
 */
export function PortfolioSummary({
  creator,
  className,
}: {
  creator: Pick<CreatorPublic, "creator_socials" | "portfolio_items">;
  className?: string;
}) {
  const t = useTranslations("creator.portfolio.summary");
  const locale = useLocale();
  const s = portfolioSummary(creator);
  if (!s) return null;
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  const stats = [
    { label: t("medianViews"), value: compact.format(s.medianViews), hint: t("medianViewsHint") },
    { label: t("er"), value: s.er != null ? `${s.er.toFixed(1)}%` : "–", hint: t("erHint") },
    { label: t("totalViews"), value: compact.format(s.totalViews) },
    { label: t("bestViews"), value: compact.format(s.bestViews) },
  ];

  return (
    <div className={className}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="min-w-0">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              {x.label}
              {x.hint && <InfoTip text={x.hint} label={x.label} />}
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tracking-[-0.025em] tabular-nums">{x.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

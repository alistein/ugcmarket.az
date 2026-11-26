"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { SHOOT_OPTIONS } from "@/schemas";

type Tagged = { shoot_options?: string[] };

const known = (list: readonly string[], v: string) => list.includes(v);

/**
 * What brands see from the enhancer: where the creator films (it changes the job).
 * `limit` folds the rest into "+N" on small cards.
 */
export function CreatorTags({
  creator: c,
  limit,
  bare,
}: {
  creator: Tagged;
  limit?: number;
  /** Only the chips, for a parent that lays them out (e.g. ClampedChips). */
  bare?: boolean;
}) {
  const tt = useTranslations("taxonomy");
  const tags = [
    ...(c.shoot_options ?? [])
      .filter((s) => known(SHOOT_OPTIONS, s))
      .map((s) => tt(`shootOptions.${s}` as never)),
  ];
  if (!tags.length) return null;
  const shown = limit ? tags.slice(0, limit) : tags;
  const rest = tags.length - shown.length;
  const chips = (
    <>
      {shown.map((label) => (
        <Badge key={label} variant="secondary">
          {label}
        </Badge>
      ))}
      {rest > 0 && <Badge variant="secondary">+{rest}</Badge>}
    </>
  );
  if (bare) return chips;
  return <div className="flex flex-wrap gap-1.5">{chips}</div>;
}

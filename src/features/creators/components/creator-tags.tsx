"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CREATOR_SKILLS, LIFESTYLE_TAGS, SHOOT_OPTIONS } from "@/schemas";

type Tagged = { lifestyle_tags?: string[]; skills?: string[]; shoot_options?: string[] };

const known = (list: readonly string[], v: string) => list.includes(v);

/**
 * What brands see from the enhancer: skills and where the creator films first (they change the
 * job), then lifestyle tags. `limit` folds the rest into "+N" on small cards.
 */
export function CreatorTags({ creator: c, limit }: { creator: Tagged; limit?: number }) {
  const tt = useTranslations("taxonomy");
  const tags = [
    ...(c.skills ?? []).filter((s) => known(CREATOR_SKILLS, s)).map((s) => tt(`skills.${s}` as never)),
    ...(c.shoot_options ?? [])
      .filter((s) => known(SHOOT_OPTIONS, s))
      .map((s) => tt(`shootOptions.${s}` as never)),
    ...(c.lifestyle_tags ?? [])
      .filter((s) => known(LIFESTYLE_TAGS, s))
      .map((s) => tt(`lifestyle.${s}` as never)),
  ];
  if (!tags.length) return null;
  const shown = limit ? tags.slice(0, limit) : tags;
  const rest = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((label) => (
        <Badge key={label} variant="secondary">
          {label}
        </Badge>
      ))}
      {rest > 0 && <Badge variant="secondary">+{rest}</Badge>}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { GENDERS } from "@/schemas";
import { ageRange } from "./hooks";

/** "Qadın · 25–34 yaş": gender and age range, or null when neither is set (older profiles). */
export function useCreatorWho() {
  const tt = useTranslations("taxonomy");
  return (c: { gender?: string | null; birth_year?: number | null }) => {
    const parts: string[] = [];
    if (c.gender && (GENDERS as readonly string[]).includes(c.gender))
      parts.push(tt(`genders.${c.gender as (typeof GENDERS)[number]}`));
    const age = ageRange(c.birth_year);
    if (age) parts.push(tt(`ageRanges.${age}`));
    return parts.length ? parts.join(" · ") : null;
  };
}

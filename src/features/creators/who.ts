"use client";

import { useTranslations } from "next-intl";
import { GENDERS } from "@/schemas";

/** Age from the birth year (we don't ask the date, so it can be a year off around birthdays). */
export const ageFrom = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear;

/** "Qadın · 30 yaş": gender and age, or null when neither is set. */
export function useCreatorWho() {
  const tt = useTranslations("taxonomy");
  return (c: { gender?: string | null; birth_year?: number | null }) => {
    const parts: string[] = [];
    if (c.gender && (GENDERS as readonly string[]).includes(c.gender))
      parts.push(tt(`genders.${c.gender as (typeof GENDERS)[number]}`));
    if (c.birth_year) parts.push(tt("age", { age: ageFrom(c.birth_year) }));
    return parts.length ? parts.join(" · ") : null;
  };
}

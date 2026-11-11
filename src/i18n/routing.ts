import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Launch in Azerbaijani; ru/en are wired but can stay hidden in the UI until translated.
  locales: ["az", "ru", "en"],
  defaultLocale: "az",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/** Narrow a route param to a supported locale (falls back to the default). */
export function toLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value) ? (value as Locale) : routing.defaultLocale;
}

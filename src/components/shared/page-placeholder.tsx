"use client";

import { useTranslations } from "next-intl";

/** Temporary scaffold screen. Replace each usage with the real feature UI. */
type PageKey = `pages.${keyof (typeof import("../../../messages/az.json"))["pages"]}`;

export function PagePlaceholder({ titleKey, children }: { titleKey: PageKey; children?: React.ReactNode }) {
  const t = useTranslations();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      <p className="mt-2 text-sm text-neutral-500">{t("common.scaffold")}</p>
      {children}
    </main>
  );
}

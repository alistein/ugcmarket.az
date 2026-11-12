"use client";

import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Link } from "@/i18n/navigation";

// Client components on purpose: next-intl's server Link reads the request locale (runtime data),
// which would block prerendering under Cache Components.
export function AuthHeader() {
  return (
    <header className="flex w-full items-center gap-2 px-5 pt-5 sm:px-8 sm:pt-7">
      <Link href="/" className="font-heading text-2xl font-semibold tracking-[-0.04em]">
        ugc<span className="text-primary">market</span>
      </Link>
      <div className="ml-auto">
        <LanguageMenu />
      </div>
    </header>
  );
}

export function AuthFooter() {
  const t = useTranslations("auth");
  return (
    <footer className="px-5 pb-6 text-center text-xs text-muted-foreground sm:pb-8">{t("footer")}</footer>
  );
}

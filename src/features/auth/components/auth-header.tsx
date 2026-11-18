"use client";

import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";

// Client components on purpose: next-intl's server Link reads the request locale (runtime data),
// which would block prerendering under Cache Components.
export function AuthHeader() {
  return (
    <header className="flex w-full items-center gap-2 px-5 pt-5 sm:px-8 sm:pt-7">
      <Link href="/" className="group/logo text-xl">
        <Logo />
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
    <footer className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-5 pb-6 text-center text-xs text-muted-foreground sm:pb-8">
      <span>{t("footer")}</span>
      <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
        {t("terms")}
      </Link>
      <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
        {t("privacy")}
      </Link>
    </footer>
  );
}

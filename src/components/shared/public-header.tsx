"use client";

import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";

/** Header of public pages (creator profile, listing): logo, language, and log in when signed out. */
export function PublicHeader({ className }: { className?: string }) {
  const t = useTranslations("creator.public");
  const { data: me } = useMe();
  return (
    <header className={className ?? "mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-4"}>
      <Link href="/" className="group/logo text-xl">
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <LanguageMenu />
        {!me && (
          <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            {t("login")}
          </Button>
        )}
      </div>
    </header>
  );
}

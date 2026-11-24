"use client";

import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/shared/app-shell";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";

/**
 * Header of public pages (board, listing, creator profile). Signed in: the same header as the
 * app pages (avatar menu with name and photo). Signed out: logo, language and log in.
 */
export function PublicHeader({ className }: { className?: string }) {
  const t = useTranslations("creator.public");
  const { data: me, isPending } = useMe();
  const cls = className ?? "mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-4";

  if (me) return <AppHeader className={cls} />;

  return (
    <header className={cls}>
      <Link href="/" className="group/logo text-xl">
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <LanguageMenu />
        {!isPending && (
          <Button size="sm" variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            {t("login")}
          </Button>
        )}
      </div>
    </header>
  );
}

"use client";

import {
  Home01Icon,
  Logout03Icon,
  Megaphone01Icon,
  Task01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { NamedAvatar } from "@/components/shared/named-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/hooks";
import { useMe } from "@/features/me/hooks";
import { Link, usePathname } from "@/i18n/navigation";

type NavItem = {
  href: "/me" | "/campaigns" | "/me/applications" | "/me/profile";
  key: "home" | "campaigns" | "applications" | "profile";
  icon: typeof Home01Icon;
};

const CREATOR_NAV: NavItem[] = [
  { href: "/me", key: "home", icon: Home01Icon },
  { href: "/campaigns", key: "campaigns", icon: Megaphone01Icon },
  { href: "/me/applications", key: "applications", icon: Task01Icon },
  { href: "/me/profile", key: "profile", icon: UserCircleIcon },
];

/**
 * Signed-in app frame. Desktop: top bar with nav. Phones: top bar + bottom tab bar
 * (thumb reach; safe-area aware). Must render inside RoleGate (usePathname → Suspense).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("app.nav");
  const nav = CREATOR_NAV;
  const isActive = (href: string) => (href === "/me" ? pathname === "/me" : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:h-16">
          <Link href="/me" className="font-heading text-xl font-semibold tracking-[-0.04em]">
            ugc<span className="text-primary">market</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label={t("label")}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <LanguageMenu />
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pt-10 md:pb-16">
        {children}
      </main>

      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground select-none aria-[current=page]:text-primary"
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-[22px]" />
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function AccountMenu() {
  const t = useTranslations("app");
  const ta = useTranslations("auth");
  const { data: me } = useMe();
  const signOut = useSignOut();
  const name = me?.creator?.handle ?? me?.brand?.name ?? me?.email ?? "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
      >
        <NamedAvatar name={name} single />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {me?.email && <DropdownMenuLabel className="truncate">{me.email}</DropdownMenuLabel>}
        {me?.creator?.handle && (
          <DropdownMenuItem render={<Link href={`/creator/${me.creator.handle}`} />}>
            <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
            {t("publicProfile")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          {ta("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

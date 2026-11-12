"use client";

import {
  Globe02Icon,
  Logout03Icon,
  Megaphone01Icon,
  PencilEdit02Icon,
  Task01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/hooks";
import { useMyCreator } from "@/features/creators/hooks";
import { useMe } from "@/features/me/hooks";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "az", label: "Azərbaycanca" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

/**
 * Signed-in frame (Luhive-style): logo left; one primary action + the avatar menu right.
 * No nav bar — every destination lives in the page itself or in the avatar menu.
 * Must render inside RoleGate (usePathname → Suspense).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("app");
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pt-5 pb-2 sm:pt-7">
        <Link href="/me" className="font-heading text-2xl font-semibold tracking-[-0.04em]">
          ugc<span className="text-primary">market</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button
            className="hidden bg-foreground text-background hover:bg-foreground/90 sm:inline-flex"
            nativeButton={false}
            render={<Link href="/campaigns" />}
          >
            {t("browseCampaigns")}
          </Button>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:pt-10">{children}</main>
    </div>
  );
}

function AccountMenu() {
  const t = useTranslations("app");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe();
  const { data: creator } = useMyCreator(me?.role === "creator");
  const signOut = useSignOut();
  const name = creator?.display_name ?? me?.brand?.name ?? me?.email ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full outline-none [transition:scale_160ms_var(--ease-out)] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
      >
        <NamedAvatar name={name} src={creator?.avatar_url} size="lg" single />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5">
        <div className="flex items-center gap-3 px-3 py-3">
          <NamedAvatar name={name} src={creator?.avatar_url} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {me?.email && <p className="truncate text-sm text-muted-foreground">{me.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {me?.creator?.handle && (
            <DropdownMenuItem render={<Link href={`/creator/${me.creator.handle}`} />}>
              <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
              {t("publicProfile")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link href="/me/profile" />}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            {t("editProfile")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/campaigns" />}>
            <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} />
            {t("browseCampaigns")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/me/applications" />}>
            <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
            {t("myApplications")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-3.5" />
            {t("language")}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(v) => router.replace(pathname, { locale: v as Locale })}
          >
            {LOCALES.map((l) => (
              <DropdownMenuRadioItem key={l.value} value={l.value}>
                {l.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          {ta("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import {
  Add01Icon,
  Logout03Icon,
  Megaphone01Icon,
  PencilEdit02Icon,
  Task01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Logo } from "@/components/shared/logo";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/hooks";
import { useMyBrand } from "@/features/brands/hooks";
import { useMyCreator } from "@/features/creators/hooks";
import { useMe } from "@/features/me/hooks";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Signed-in frame (Luhive-style) for creators and brands: logo left; one primary action
 * (by role) + the avatar menu right.
 * No nav bar — every destination lives in the page itself or in the avatar menu.
 * Parts that read the URL sit in their own Suspense, so the shell can also be a loading fallback.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pt-5 pb-2 sm:pt-7" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:pt-10 sm:pb-16">{children}</main>
    </div>
  );
}

/**
 * The signed-in header: logo (to the dashboard), the role's one action, language and the avatar
 * menu. Shared by the app pages and by public pages (board, listing, creator profile) when the
 * visitor is signed in, so the navbar stays the same everywhere. `className` sets the width.
 */
export function AppHeader({ className }: { className: string }) {
  const { data: me } = useMe();
  return (
    <header className={className}>
      {/* The logo always goes to the landing page, signed in or not. */}
      <Link href="/" className="group/logo text-xl">
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {/* Both use usePathname → each in its own Suspense (the shell is also a Suspense fallback). */}
        <Suspense fallback={null}>
          <HeaderAction role={me?.role} hasBrand={!!me?.brand} hasCreator={!!me?.creator} />
        </Suspense>
        <Suspense fallback={<span className="h-9 w-16" aria-hidden />}>
          <LanguageMenu />
        </Suspense>
        <AccountMenu />
      </div>
      {/* Phones: Elanlar / Profil floating at the bottom (creators with a profile). Fixed, so its
          place in the DOM doesn't matter; it lives here to be on every signed-in page. */}
      <Suspense fallback={null}>{me?.role === "creator" && me.creator && <CreatorTabBar />}</Suspense>
    </header>
  );
}

/**
 * Pinterest-style bottom bar on phones: two floating tiles, Elanlar and Profil (the photo).
 * The current one is marked; no entrance motion (it's on every page), only press feedback.
 * Pages leave room for it with `pb-28` on phones; the edit page's save bar sits above it.
 */
function CreatorTabBar() {
  const t = useTranslations("app");
  const pathname = usePathname();
  const { data: creator } = useMyCreator();
  const onBoard = pathname === "/campaigns" || pathname.startsWith("/campaigns/");
  const onProfile = pathname === "/me" || pathname === "/me/profile";
  const tile =
    "flex size-12 items-center justify-center rounded-2xl bg-card shadow-(--shadow-float) ring-1 ring-foreground/[0.06] outline-none [transition:scale_160ms_var(--ease-out)] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97] dark:ring-white/10";
  return (
    <nav
      aria-label={t("account")}
      className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center gap-3 sm:hidden"
    >
      <Link
        href="/campaigns"
        aria-label={t("browseCampaigns")}
        aria-current={onBoard ? "page" : undefined}
        className={cn(tile, onBoard ? "text-foreground" : "text-muted-foreground")}
      >
        <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={onBoard ? 2.25 : 1.75} className="size-6" />
      </Link>
      <Link
        href="/me"
        aria-label={t("myProfile")}
        aria-current={onProfile ? "page" : undefined}
        className={tile}
      >
        <span
          className={cn("rounded-full", onProfile && "ring-2 ring-foreground ring-offset-2 ring-offset-card")}
        >
          <NamedAvatar name={creator?.display_name ?? "?"} src={creator?.avatar_url} size="sm" single />
        </span>
      </Link>
    </nav>
  );
}

/** The one header action: creators browse listings, brands post one. Both only after setup. */
function HeaderAction({
  role,
  hasBrand,
  hasCreator,
}: {
  role: string | null | undefined;
  hasBrand: boolean;
  hasCreator: boolean;
}) {
  const t = useTranslations("app");
  const pathname = usePathname();
  const cls = "hidden bg-foreground text-background hover:bg-foreground/90 sm:inline-flex";
  // The board has its own "post a listing" button and is itself "browse listings".
  if (pathname === "/campaigns") return null;
  if (role === "creator" && hasCreator)
    return (
      <Button className={cls} nativeButton={false} render={<Link href="/campaigns" />}>
        {t("browseCampaigns")}
      </Button>
    );
  if (role === "brand" && hasBrand && pathname !== "/brand/campaigns/new")
    return (
      <Button className={cls} nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        {t("newListing")}
      </Button>
    );
  return null;
}

function AccountMenu() {
  const t = useTranslations("app");
  const ta = useTranslations("auth");
  const { data: me } = useMe();
  const isBrand = me?.role === "brand";
  const { data: creator } = useMyCreator(me?.role === "creator");
  const { data: brand } = useMyBrand(isBrand);
  const signOut = useSignOut();
  const name = creator?.display_name ?? brand?.name ?? me?.brand?.name ?? me?.email ?? "?";
  const avatar = isBrand ? brand?.logo_url : creator?.avatar_url;
  // Until the profile exists the only place to be is its setup form: no shortcuts elsewhere.
  const setUp = isBrand ? !!me?.brand : !!me?.creator;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className="rounded-full outline-none [transition:scale_160ms_var(--ease-out)] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
      >
        <NamedAvatar name={name} src={avatar} size="lg" single square={isBrand} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5">
        <div className="flex items-center gap-3 px-3 py-3">
          <NamedAvatar name={name} src={avatar} size="lg" square={isBrand} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {me?.email && name !== me.email && (
              <p className="truncate text-sm text-muted-foreground">{me.email}</p>
            )}
          </div>
        </div>
        {setUp && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>{isBrand ? <BrandItems /> : <CreatorItems />}</DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          {ta("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreatorItems() {
  const t = useTranslations("app");
  return (
    <>
      <DropdownMenuItem render={<Link href="/me" />}>
        <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />
        {t("myProfile")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/campaigns" />}>
        <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} />
        {t("browseCampaigns")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/me/applications" />}>
        <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
        {t("myApplications")}
      </DropdownMenuItem>
    </>
  );
}

function BrandItems() {
  const t = useTranslations("app");
  return (
    <>
      <DropdownMenuItem render={<Link href="/brand" />}>
        <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
        {t("myListings")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/brand/campaigns/new" />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        {t("newListing")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/brand/profile" />}>
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        {t("brandProfile")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/campaigns" />}>
        <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} />
        {t("browseCampaigns")}
      </DropdownMenuItem>
    </>
  );
}

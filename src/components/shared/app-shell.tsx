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
import { homeFor } from "@/lib/auth-routes";

/**
 * Signed-in frame (Luhive-style) for creators and brands: logo left; one primary action
 * (by role) + the avatar menu right.
 * No nav bar — every destination lives in the page itself or in the avatar menu.
 * Parts that read the URL sit in their own Suspense, so the shell can also be a loading fallback.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 pt-5 pb-2 sm:pt-7">
        <Link href={me?.role ? homeFor(me.role) : "/"} className="group/logo text-xl">
          <Logo />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {/* Both use usePathname → each in its own Suspense (the shell is also a Suspense fallback). */}
          <Suspense fallback={null}>
            <HeaderAction role={me?.role} hasBrand={!!me?.brand} />
          </Suspense>
          <Suspense fallback={<span className="h-9 w-16" aria-hidden />}>
            <LanguageMenu />
          </Suspense>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:pt-10">{children}</main>
    </div>
  );
}

/** The one header action: creators browse listings, brands post one (after setup). */
function HeaderAction({ role, hasBrand }: { role: string | null | undefined; hasBrand: boolean }) {
  const t = useTranslations("app");
  const pathname = usePathname();
  const cls = "hidden bg-foreground text-background hover:bg-foreground/90 sm:inline-flex";
  if (role === "creator")
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
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {isBrand ? <BrandItems hasBrand={!!brand} /> : <CreatorItems handle={me?.creator?.handle} />}
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

function CreatorItems({ handle }: { handle: string | undefined }) {
  const t = useTranslations("app");
  return (
    <>
      {handle && (
        <DropdownMenuItem render={<Link href={`/creator/${handle}`} />}>
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
    </>
  );
}

function BrandItems({ hasBrand }: { hasBrand: boolean }) {
  const t = useTranslations("app");
  return (
    <>
      <DropdownMenuItem render={<Link href="/brand" />}>
        <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
        {t("myListings")}
      </DropdownMenuItem>
      {hasBrand && (
        <DropdownMenuItem render={<Link href="/brand/campaigns/new" />}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          {t("newListing")}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem render={<Link href="/brand/profile" />}>
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        {t(hasBrand ? "brandProfile" : "brandSetup")}
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/campaigns" />}>
        <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} />
        {t("browseCampaigns")}
      </DropdownMenuItem>
    </>
  );
}

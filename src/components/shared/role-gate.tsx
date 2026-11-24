"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";
import { AccountBlocked } from "@/features/auth/components/account-blocked";
import { useMe } from "@/features/me/hooks";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppRole, homeFor } from "@/lib/auth-routes";
import { LoadingState, PageSkeleton } from "./loading-state";

type Props = {
  role: AppRole;
  children: React.ReactNode;
  /** Shown while the session loads. Defaults to a generic page skeleton. */
  fallback?: React.ReactNode;
};

/**
 * Client-side guard for role areas — UX only. src/proxy.ts already bounces signed-out users;
 * real enforcement is requireRole() in the API + RLS.
 *  signed out → /login?next=…   · no role → /onboarding   · wrong role → own home
 *  blocked → blocked screen (API returns 403 for everything anyway)
 */
export function RoleGate(props: Props) {
  // usePathname inside → Suspense required on dynamic routes (Next 16 + Cache Components).
  return (
    <Suspense fallback={props.fallback ?? <DefaultFallback />}>
      <Gate {...props} />
    </Suspense>
  );
}

function DefaultFallback() {
  return (
    <LoadingState className="mx-auto w-full max-w-5xl px-4 pt-16">
      <PageSkeleton />
    </LoadingState>
  );
}

function LoadFailed() {
  const t = useTranslations("common");
  return (
    <p role="alert" className="flex flex-1 items-center justify-center p-10 text-sm text-destructive">
      {t("loadFailed")}
    </p>
  );
}

function Gate({ role, children, fallback }: Props) {
  const { data: me, isPending: loading, isFetching, isError } = useMe();
  // A cached "signed out" (null) that is being refetched is not an answer yet: right after sign-in
  // it is stale, and acting on it bounces the user to /login.
  const isPending = loading || (!me && isFetching);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const allowed = !!me && me.status !== "blocked" && (me.role === role || me.role === "admin");

  useEffect(() => {
    if (isPending || isError || allowed) return;
    if (!me) router.replace({ pathname: "/login", query: { next: `/${locale}${pathname}` } });
    else if (me.status === "blocked") return;
    else router.replace(homeFor(me.role));
  }, [me, isPending, isError, allowed, router, pathname, locale]);

  if (me?.status === "blocked") return <AccountBlocked />;
  if (isError) return <LoadFailed />;
  if (!allowed) return fallback ?? <DefaultFallback />;
  return <>{children}</>;
}

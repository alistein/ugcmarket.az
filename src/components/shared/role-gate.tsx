"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense, useEffect } from "react";
import { AccountBlocked } from "@/features/auth/components/account-blocked";
import { useMe } from "@/features/me/hooks";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppRole, homeFor } from "@/lib/auth-routes";

type Props = { role: AppRole; children: React.ReactNode };

/**
 * Client-side guard for role areas — UX only. src/proxy.ts already bounces signed-out users;
 * real enforcement is requireRole() in the API + RLS.
 *  signed out → /login?next=…   · no role → /onboarding   · wrong role → own home
 *  blocked → blocked screen (API returns 403 for everything anyway)
 */
export function RoleGate(props: Props) {
  // usePathname inside → Suspense required on dynamic routes (Next 16 + Cache Components).
  return (
    <Suspense fallback={<GateStatus />}>
      <Gate {...props} />
    </Suspense>
  );
}

function GateStatus({ failed }: { failed?: boolean }) {
  const t = useTranslations("common");
  return (
    <div role="status" className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
      {failed ? t("loadFailed") : t("loading")}
    </div>
  );
}

function Gate({ role, children }: Props) {
  const { data: me, isPending, isError } = useMe();
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
  if (!allowed) return <GateStatus failed={isError} />;
  return <>{children}</>;
}

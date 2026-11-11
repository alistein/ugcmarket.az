"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useMe } from "@/features/me/hooks";
import { useRouter } from "@/i18n/navigation";

/** Client-side guard for role areas. Real enforcement is in the API (requireRole) + RLS. */
export function RoleGate({ role, children }: { role: "brand" | "creator" | "admin"; children: React.ReactNode }) {
  const { data: me, isPending } = useMe();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    if (isPending) return;
    if (!me) router.replace("/login");
    else if (!me.role) router.replace("/onboarding");
    else if (me.role !== role && me.role !== "admin") router.replace("/");
  }, [me, isPending, role, router]);

  if (isPending || !me || (me.role !== role && me.role !== "admin")) {
    return <div className="p-10 text-sm text-neutral-500">{t("loading")}</div>;
  }
  return <>{children}</>;
}

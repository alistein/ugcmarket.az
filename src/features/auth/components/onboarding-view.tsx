"use client";

import { Megaphone01Icon, UserStar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { meKeys, useMe, useSetRole } from "@/features/me/hooks";
import { useRouter } from "@/i18n/navigation";
import { homeFor } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { OnboardingRole } from "@/schemas/auth";
import { useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api-client";
import { type AuthErrorKey } from "../errors";
import { useSignOut } from "../hooks";
import { AccountBlocked } from "./account-blocked";
import { AuthCard, FormError, SubmitButton } from "./auth-ui";

const OPTIONS = [
  { value: "brand", icon: Megaphone01Icon, tint: "bg-sun text-sun-ink" },
  { value: "creator", icon: UserStar01Icon, tint: "bg-mint text-mint-ink" },
] as const;

/** Title, two role cards and the button, at the AuthCard's sizes. */
function OnboardingSkeleton() {
  return (
    <LoadingState className="w-full">
      <Skeleton className="mb-10 h-5 w-16" />
      <Skeleton className="mx-auto h-10 w-64 max-w-full" />
      <Skeleton className="mx-auto mt-3 h-4 w-72 max-w-full" />
      <div className="mt-9 grid gap-3">
        <Skeleton className="h-[4.75rem] rounded-2xl" />
        <Skeleton className="h-[4.75rem] rounded-2xl" />
        <Skeleton className="mt-1 h-11 rounded-xl" />
      </div>
    </LoadingState>
  );
}

/**
 * Post-auth router + role picker. Users with a role are sent home immediately, so every auth
 * flow can simply land here. The role is set once (API + set_my_role() in the DB).
 */
export function OnboardingView() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const router = useRouter();
  const { data: me, isPending } = useMe();
  const setRole = useSetRole();
  const qc = useQueryClient();
  const signOut = useSignOut();
  const [role, setRoleChoice] = useState<OnboardingRole | null>(
    OnboardingRole.safeParse(params.get("role")).data ?? null,
  );
  const [error, setError] = useState<AuthErrorKey | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!me) router.replace({ pathname: "/login", query: { next: window.location.pathname } });
    else if (me.role && me.status !== "blocked") router.replace(homeFor(me.role));
  }, [me, isPending, router]);

  if (me?.status === "blocked") return <AccountBlocked />;
  if (isPending || !me || me.role) return <OnboardingSkeleton />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // One request per choice: ignore extra submits (double tap, Enter) while it's in flight.
    if (!role || setRole.isPending || setRole.isSuccess) return;
    setError(null);
    setRole.mutate(role, {
      onSuccess: () => router.replace(homeFor(role)),
      onError: (err) => {
        // 409 role_already_set → another tab already chose; refetching `me` routes us home.
        if (err instanceof ApiClientError && err.status === 409)
          void qc.invalidateQueries({ queryKey: meKeys.all });
        else setError(err instanceof ApiClientError && err.status === 0 ? "network" : "unknown");
      },
    });
  };

  return (
    <AuthCard
      title={t("onboarding.title")}
      subtitle={t("onboarding.subtitle")}
      footer={
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2">
          {me.email && t("onboarding.signedInAs", { email: me.email })}
          <Button
            variant="link"
            size="sm"
            className="px-0"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            {t("signOut")}
          </Button>
        </span>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <fieldset className="grid gap-3">
          <legend className="sr-only">{t("onboarding.title")}</legend>
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-2xl bg-muted p-4 ring-2 ring-transparent transition-[background-color,box-shadow] duration-150 select-none",
                "has-checked:bg-card has-checked:shadow-(--shadow-soft) has-checked:ring-primary has-focus-visible:ring-ring/40",
              )}
            >
              <input
                type="radio"
                name="role"
                value={o.value}
                checked={role === o.value}
                onChange={() => setRoleChoice(o.value)}
                className="sr-only"
              />
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", o.tint)}>
                <HugeiconsIcon icon={o.icon} strokeWidth={2} className="size-5" />
              </span>
              <span className="grid gap-0.5">
                <span className="font-medium">{t(`onboarding.${o.value}.title`)}</span>
                <span className="text-sm text-muted-foreground">{t(`onboarding.${o.value}.body`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <FormError error={error} />
        <SubmitButton disabled={!role} pending={setRole.isPending || setRole.isSuccess}>
          {t("onboarding.continue")}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/hooks";

/** Shown to blocked accounts in any gated area. The API already answers 403 for them. */
export function AccountBlocked() {
  const t = useTranslations("auth");
  const signOut = useSignOut();
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{t("blocked.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("blocked.body")}</p>
      <Button
        variant="outline"
        className="mt-2"
        disabled={signOut.isPending}
        onClick={() => signOut.mutate()}
      >
        {t("signOut")}
      </Button>
    </main>
  );
}

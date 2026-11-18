"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Wraps a skeleton that mirrors the screen being loaded. Screen readers hear "Yüklənir…" once;
 * sighted users see the skeleton fade in after 150ms, so fast loads never flash (fade only, so
 * reduced motion keeps it as is).
 */
export function LoadingState({ className, children }: { className?: string; children: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <div
      role="status"
      className={cn("transition-opacity delay-150 duration-200 ease-out starting:opacity-0", className)}
    >
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

/** Generic page: title, subtitle, one card. For screens without a dedicated skeleton. */
export function PageSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-56 max-w-full" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-8 h-48 rounded-3xl" />
    </>
  );
}

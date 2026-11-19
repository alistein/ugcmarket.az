"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Field placeholder: label + control at the kit's real sizes (input h-9, textarea ~min-h-16). */
export function SkeletonField({
  textarea,
  rows = 3,
  className,
  labelWidth = "w-24",
}: {
  textarea?: boolean;
  rows?: number;
  className?: string;
  labelWidth?: string;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Skeleton className={cn("h-3.5", labelWidth)} />
      {textarea ? (
        <Skeleton className="rounded-2xl" style={{ height: `${Math.max(64, rows * 24 + 24)}px` }} />
      ) : (
        <Skeleton className="h-9 rounded-full" />
      )}
    </div>
  );
}

/** A row of chip placeholders (h-9 like ChipGroup / ChoiceChips). */
export function SkeletonChips({ widths }: { widths: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {widths.map((w, i) => (
        <Skeleton key={i} className={cn("h-9 rounded-full", w)} />
      ))}
    </div>
  );
}

/** Back link ("‹ Geri"): mb-6 like BackToBrand. */
export function SkeletonBack() {
  return <Skeleton className="mb-6 h-5 w-16" />;
}

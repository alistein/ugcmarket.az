"use client";

import { MinusSignIcon, PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const chip = cn(
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm select-none",
  "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease,color_150ms_ease] active:scale-[0.97]",
  "outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
);

/** Single choice as tappable chips (format, payment type, follower minimum). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  label,
  invalid,
  describedBy,
  ariaLabel,
}: {
  options: readonly T[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  label: (v: T) => string;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      data-invalid={invalid || undefined}
      className="flex flex-wrap gap-2 rounded-2xl data-invalid:ring-2 data-invalid:ring-destructive/30 data-invalid:ring-offset-4 data-invalid:ring-offset-background"
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={cn(
              chip,
              on
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
            )}
          >
            {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />}
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/** − value + for small counts (posts, creators needed). */
export function NumberStepper({
  id,
  value,
  onChange,
  min,
  max,
  decreaseLabel,
  increaseLabel,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const btn = cn(
    "flex size-11 items-center justify-center rounded-xl text-foreground outline-none",
    "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease] active:scale-[0.97]",
    "hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] focus-visible:ring-4 focus-visible:ring-ring/25",
    "disabled:pointer-events-none disabled:opacity-40",
  );
  return (
    <div className="inline-flex w-fit items-center rounded-xl bg-muted">
      <button
        type="button"
        className={btn}
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-4" />
      </button>
      <output id={id} aria-live="polite" className="w-10 text-center font-medium tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
      </button>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A wrapping row of chips (badges) cut to two lines, with "Daha çox" when more are hidden.
 * The height is measured from the first chip, so it works for any chip size and any width.
 */
export function ClampedChips({ children, className }: { children: React.ReactNode; className?: string }) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
      const twoRows = first.offsetHeight * 2 + gap;
      setLimit(twoRows);
      setOverflows(el.scrollHeight > twoRows + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className="grid gap-2">
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-1.5 overflow-hidden", className)}
        style={!open && limit ? { maxHeight: limit } : undefined}
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-fit text-xs font-medium text-foreground/80 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:underline"
        >
          {open ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}

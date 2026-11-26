"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Chips cut to one line, with a "+N" chip for the rest; tapping it shows them all (wrapping).
 * `min` keeps a few always visible even on narrow screens (then they wrap).
 * Widths are measured from an invisible copy, so it fits any chip size, label length and width.
 */
export function OneRowChips({
  items,
  className,
  moreClassName,
  min = 1,
}: {
  items: React.ReactNode[];
  /** Always show at least this many, wrapping onto a second line when they don't fit in one. */
  min?: number;
  className?: string;
  /** Classes for the "+N" chip, to match the chips around it. */
  moreClassName?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(items.length);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    const m = measure.current;
    if (!el || !m) return;
    const calc = () => {
      const kids = [...m.children] as HTMLElement[];
      const plus = kids.pop()!; // last one is a sample "+99" chip
      const gap = parseFloat(getComputedStyle(m).columnGap) || 0;
      const width = el.clientWidth;
      const widths = kids.map((k) => k.offsetWidth);
      let used = 0;
      let k = 0;
      for (; k < widths.length; k++) {
        const next = used + (k ? gap : 0) + widths[k];
        const rest = k + 1 < widths.length ? gap + plus.offsetWidth : 0;
        if (next + rest > width) break;
        used = next;
      }
      setFits(k);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  const fit = Math.min(items.length, Math.max(min, fits, 1));
  const hidden = items.length - fit;
  // Fewer than `min` fit on one line: let the shown ones wrap rather than clip.
  const wrap = open || fit > fits;
  return (
    <div ref={box} className="relative w-full min-w-0">
      <div
        aria-hidden
        ref={measure}
        className={cn("invisible absolute flex gap-1.5 whitespace-nowrap", className)}
      >
        {items}
        <span className={moreClassName}>+99</span>
      </div>
      <div className={cn("flex gap-1.5 [&>*]:shrink-0", wrap ? "flex-wrap" : "overflow-hidden", className)}>
        {open || hidden <= 0 ? items : items.slice(0, fit)}
        {!open && hidden > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`+${hidden}`}
            className={cn(
              "shrink-0 outline-none [transition:scale_160ms_var(--ease-out)] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]",
              moreClassName,
            )}
          >
            +{hidden}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import { UnfoldMoreIcon, Tick02Icon, Search01Icon } from "@hugeicons/core-free-icons";

/**
 * A select with a search field: the trigger looks like `SelectTrigger`, the popup opens with a
 * search input on top that filters the list. Use for long lists (15+ options); pass
 * `autoHighlight` so Enter picks the first match.
 */
const Combobox = ComboboxPrimitive.Root;

function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "flex h-9 w-fit items-center justify-between gap-1.5 rounded-4xl border border-transparent bg-muted px-3.5 py-2 text-sm whitespace-nowrap transition-colors outline-none hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_3%)] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-popup-open:border-ring/40 data-popup-open:bg-card dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">{children}</span>
      <HugeiconsIcon
        icon={UnfoldMoreIcon}
        strokeWidth={2}
        className="pointer-events-none size-4 text-muted-foreground"
      />
    </ComboboxPrimitive.Trigger>
  );
}

/** Selected value or the placeholder (muted). */
function ComboboxValue({
  placeholder,
  children,
}: {
  placeholder?: React.ReactNode;
  children?: (value: any) => React.ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  return (
    <ComboboxPrimitive.Value>
      {(value: unknown) =>
        value == null || value === "" ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : children ? (
          children(value)
        ) : (
          String(value)
        )
      }
    </ComboboxPrimitive.Value>
  );
}

function ComboboxContent({
  className,
  children,
  searchPlaceholder,
  empty,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  ...props
}: Omit<ComboboxPrimitive.Popup.Props, "children"> &
  Pick<ComboboxPrimitive.Positioner.Props, "align" | "side" | "sideOffset"> & {
    /** Items, or a function of each (filtered) item from `items` on the root. */
    children?: ComboboxPrimitive.List.Props["children"];
    searchPlaceholder?: string;
    /** Shown when the search matches nothing. */
    empty?: React.ReactNode;
  }) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "relative isolate z-50 flex max-h-[min(var(--available-height),24rem)] w-(--anchor-width) min-w-56 origin-(--transform-origin) flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-(--shadow-float) ring-1 ring-foreground/5 transition-[opacity,scale] duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 dark:ring-white/10",
            className,
          )}
          {...props}
        >
          <div className="relative mb-1 shrink-0 p-1.5">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            {/* 16px on phones so iOS doesn't zoom the page on focus. */}
            <ComboboxPrimitive.Input
              data-slot="combobox-search"
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-xl bg-muted pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-ring/15 sm:text-sm"
            />
          </div>
          {empty != null && (
            <ComboboxPrimitive.Empty className="px-3 py-2.5 text-sm text-muted-foreground empty:hidden">
              {empty}
            </ComboboxPrimitive.Empty>
          )}
          <ComboboxPrimitive.List className="min-h-0 flex-1 scroll-py-1 overflow-y-auto overscroll-contain p-1 pt-0 empty:hidden">
            {children}
          </ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

export { Combobox, ComboboxContent, ComboboxItem, ComboboxTrigger, ComboboxValue };

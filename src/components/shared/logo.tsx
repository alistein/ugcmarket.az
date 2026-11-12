import { cn } from "@/lib/utils";

/** Four viewfinder corners on a 64-unit grid. Same geometry as public/brand/ugcmarket-mark.svg. */
const BRACKETS =
  "M10 24V16a6 6 0 0 1 6-6h8M40 10h8a6 6 0 0 1 6 6v8M54 40v8a6 6 0 0 1-6 6h-8M24 54h-8a6 6 0 0 1-6-6v-8";

type LogoProps = {
  /** One-time entrance on page load: the viewfinder focuses, then the rec light blinks twice. Landing header only. */
  animated?: boolean;
  /** Mark only, without the wordmark. */
  markOnly?: boolean;
  className?: string;
};

/**
 * UGCMarket logo: viewfinder mark + record-dot wordmark.
 * Scales with font-size (the mark is 1.73em tall); brackets follow `currentColor`, the dot is `--primary`.
 * Inside a `group/logo` link the brackets pull focus on hover. Static files live in public/brand/.
 */
export function Logo({ animated = false, markOnly = false, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="ugcmarket.az"
      className={cn(
        "inline-flex items-center gap-[0.37em] font-heading leading-none font-semibold tracking-[-0.045em]",
        className,
      )}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="size-[1.73em] shrink-0 overflow-visible">
        <g className={cn("origin-center [transform-box:fill-box]", animated && "animate-logo-focus")}>
          <path
            d={BRACKETS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="origin-center transition-[scale] duration-200 ease-out [transform-box:fill-box] group-hover/logo:scale-[0.92]"
          />
        </g>
        <circle cx="32" cy="32" r="8" className={cn("fill-primary", animated && "animate-logo-rec")} />
      </svg>
      {!markOnly && (
        <span aria-hidden="true">
          ugcmarket
          <span
            className={cn(
              "mx-[0.07em] inline-block size-[0.2em] rounded-full bg-primary",
              animated && "animate-logo-rec",
            )}
          />
          az
        </span>
      )}
    </span>
  );
}

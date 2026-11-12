import { cn } from "@/lib/utils";

/**
 * iPhone 15 Pro at 1:1 proportions: screen 300×650 (393×852pt scaled 0.763), 9px bezel,
 * titanium edge, Dynamic Island, status bar, side buttons, home indicator.
 */
export function IPhone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-[318px]", className)}>
      {/* side buttons: action + volume (left), power (right) */}
      <span className="absolute top-[118px] -left-[2.5px] h-[26px] w-[3px] rounded-l-sm bg-[#2b2826]" />
      <span className="absolute top-[166px] -left-[2.5px] h-[52px] w-[3px] rounded-l-sm bg-[#2b2826]" />
      <span className="absolute top-[228px] -left-[2.5px] h-[52px] w-[3px] rounded-l-sm bg-[#2b2826]" />
      <span className="absolute top-[190px] -right-[2.5px] h-[84px] w-[3px] rounded-r-sm bg-[#2b2826]" />

      <div className="rounded-[56px] bg-[#0f0e0d] p-[9px] shadow-[inset_0_0_0_1.5px_#4a4542,inset_0_0_0_3px_#1c1a19,var(--shadow-float)]">
        <div className="relative h-[650px] overflow-hidden rounded-[47px] bg-[color-mix(in_oklch,var(--background),var(--foreground)_2%)]">
          <StatusBar />
          <div className="absolute top-[11px] left-1/2 z-20 h-[28px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
          {children}
          <div className="absolute bottom-[7px] left-1/2 z-20 h-[4px] w-[104px] -translate-x-1/2 rounded-full bg-foreground/85" />
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-[50px] items-center justify-between px-[30px] pt-[2px] text-foreground">
      <span className="w-12 text-[15px] font-semibold tracking-[-0.01em] tabular-nums">9:41</span>
      <span className="flex items-center gap-[5px]">
        {/* cellular */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="0.8" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <path d="M7.5 2.2c2.1 0 4 .8 5.5 2.1l1.1-1.2A9.6 9.6 0 0 0 7.5.5 9.6 9.6 0 0 0 .9 3.1L2 4.3a7.9 7.9 0 0 1 5.5-2.1Z" />
          <path d="M7.5 5.4c1.2 0 2.3.5 3.2 1.2l1.1-1.2a6.4 6.4 0 0 0-8.6 0l1.1 1.2c.9-.7 2-1.2 3.2-1.2Z" />
          <path d="M7.5 8.4c.5 0 .9.2 1.2.5L7.5 10.3 6.3 8.9c.3-.3.7-.5 1.2-.5Z" />
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" />
          <path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

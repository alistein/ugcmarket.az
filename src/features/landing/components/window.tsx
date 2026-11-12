import { cn } from "@/lib/utils";

/** macOS-style window chrome (reference sites' step cards). */
export function AppWindow({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-3xl bg-card shadow-(--shadow-raised) ring-1 ring-foreground/[0.05] dark:ring-white/[0.07]", className)}>
      <div className="relative flex h-10 items-center border-b border-border/60 px-4">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="absolute inset-x-0 text-center font-mono text-[11px] text-muted-foreground">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

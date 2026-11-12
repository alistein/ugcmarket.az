import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-xl bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_oklch,var(--muted),var(--foreground)_5%)_50%,var(--muted)_75%)] bg-size-[200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }

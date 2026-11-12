"use client";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Named avatars take their own color from the joy palette, picked from the name so it stays stable. */
const TONES = [
  "bg-brand-soft text-brand-ink",
  "bg-sun text-sun-ink",
  "bg-mint text-mint-ink",
  "bg-sky text-sky-ink",
  "bg-rose text-rose-ink",
];

export function avatarTone(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export function NamedAvatar({
  name,
  size,
  badge,
  single,
  className,
}: {
  name: string;
  size?: "sm" | "default" | "lg";
  badge?: boolean;
  /** One letter — for overlapping groups, where a second letter gets covered. */
  single?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, single ? 1 : 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className={cn(avatarTone(name))}>{initials}</AvatarFallback>
      {badge && <AvatarBadge className="bg-mint-ink" />}
    </Avatar>
  );
}

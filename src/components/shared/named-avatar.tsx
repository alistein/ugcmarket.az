"use client";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  square,
  src,
  className,
  fallbackClassName,
}: {
  name: string;
  /** Photo; the toned initials stay as the fallback while it loads or if it fails. */
  src?: string | null;
  /** e.g. a larger text size for big avatars. */
  fallbackClassName?: string;
  size?: "sm" | "default" | "lg";
  badge?: boolean;
  /** One letter — for overlapping groups, where a second letter gets covered. */
  single?: boolean;
  /** Rounded square instead of a circle: brand logos. */
  square?: boolean;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, single ? 1 : 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <Avatar size={size} className={cn(square && "rounded-[28%] after:rounded-[28%]", className)}>
      {src && <AvatarImage src={src} alt="" className={cn(square && "rounded-[28%]")} />}
      <AvatarFallback className={cn(avatarTone(name), square && "rounded-[28%]", fallbackClassName)}>
        {initials}
      </AvatarFallback>
      {badge && <AvatarBadge className="bg-mint-ink" />}
    </Avatar>
  );
}

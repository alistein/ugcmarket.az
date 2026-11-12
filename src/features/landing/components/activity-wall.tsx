"use client";

import { CheckmarkCircle02Icon, FavouriteIcon, PlayIcon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Ambient "marketplace is alive" wall behind the closing card: tilted columns of Reels tiles and
 * activity chips drifting slowly in alternating directions.
 * Motion (Emil): constant motion → linear, transform only, 70s per loop (barely noticeable),
 * decorative + rare page → allowed; reduced motion stops it (globals.css). aria-hidden throughout.
 */
type Tile =
  | { kind: "reel"; handle: string; likes: string; bg: string; subject: string }
  | { kind: "applied" | "accepted"; handle: string }
  | { kind: "views"; value: string }
  | { kind: "offer"; text: string };

const COLUMNS: Tile[][] = [
  [
    { kind: "reel", handle: "@aysel", likes: "1 204", bg: "#2b231e", subject: "#9c7d63" },
    { kind: "applied", handle: "@gunel" },
    { kind: "reel", handle: "@tural", likes: "689", bg: "#1f2530", subject: "#6f8db0" },
    { kind: "views", value: "+3 418" },
  ],
  [
    { kind: "accepted", handle: "@akif" },
    { kind: "reel", handle: "@nigar", likes: "2 031", bg: "#2e1e22", subject: "#c47c86" },
    { kind: "offer", text: "150 AZN · Reels" },
    { kind: "reel", handle: "@elvin", likes: "954", bg: "#1e2a24", subject: "#6fa58a" },
  ],
  [
    { kind: "reel", handle: "@leyla", likes: "3 377", bg: "#2c261b", subject: "#c9a45c" },
    { kind: "applied", handle: "@rashad" },
    { kind: "reel", handle: "@sabina", likes: "1 518", bg: "#2a1f1b", subject: "#d0876a" },
    { kind: "accepted", handle: "@lala" },
  ],
  [
    { kind: "views", value: "+12 940" },
    { kind: "reel", handle: "@kanan", likes: "807", bg: "#211f2b", subject: "#8c80b8" },
    { kind: "applied", handle: "@narmin" },
    { kind: "reel", handle: "@fidan", likes: "2 266", bg: "#2b2420", subject: "#b58b6b" },
  ],
  [
    { kind: "reel", handle: "@murad", likes: "1 090", bg: "#1d2629", subject: "#5f9aa5" },
    { kind: "offer", text: "barter · TikTok" },
    { kind: "reel", handle: "@konul", likes: "4 102", bg: "#2d2119", subject: "#d39a5c" },
    { kind: "accepted", handle: "@orxan" },
  ],
];

function TileView({ tile }: { tile: Tile }) {
  const t = useTranslations("landing.final");
  if (tile.kind === "reel") {
    return (
      <div className="relative aspect-[9/14] overflow-hidden rounded-2xl p-2.5 text-white shadow-(--shadow-raised)" style={{ background: tile.bg }}>
        <div className="absolute inset-x-[22%] top-[22%] h-[38%] rounded-[45%_45%_14px_14px]" style={{ background: tile.subject, opacity: 0.55 }} />
        <span className="absolute top-2 left-2.5 text-[10px] font-semibold">Reels</span>
        <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5 translate-x-px" />
        </span>
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between text-[10px]">
          <span className="font-semibold">{tile.handle}</span>
          <span className="flex items-center gap-1 opacity-90">
            <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-3" />
            {tile.likes}
          </span>
        </div>
      </div>
    );
  }
  if (tile.kind === "views") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-foreground px-3 py-2 text-[12px] font-semibold text-background tabular-nums shadow-(--shadow-raised)">
        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
        {tile.value} {t("views")}
      </div>
    );
  }
  if (tile.kind === "offer") {
    return (
      <div className="rounded-[1.1rem] rounded-br-md bg-[#0a84ff] px-3.5 py-2 text-[12px] font-medium text-white shadow-(--shadow-raised)">{tile.text}</div>
    );
  }
  const accepted = tile.kind === "accepted";
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-card px-3 py-2.5 text-[12px] font-medium shadow-(--shadow-raised) ring-1 ring-foreground/5">
      <span className={cn("size-2 shrink-0 rounded-full", accepted ? "bg-mint-ink" : "bg-primary")} />
      <span className="truncate">{t(accepted ? "accepted" : "applied", { handle: tile.handle })}</span>
      {accepted && <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5 shrink-0 text-mint-ink" />}
    </div>
  );
}

export function ActivityWall() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_42%_48%_at_50%_50%,transparent_45%,black_100%)]"
    >
      <div className="absolute -inset-x-16 -inset-y-24 grid rotate-[-8deg] grid-cols-3 gap-4 opacity-45 saturate-[0.85] md:grid-cols-5 dark:opacity-35">
        {COLUMNS.map((col, ci) => (
          <div key={ci} className={cn("overflow-hidden", ci >= 3 && "hidden md:block")}>
            {/* Two copies → seamless loop at translateY(-50%). Alternate columns run in reverse. */}
            <div
              className="flex animate-drift flex-col gap-4"
              style={{ animationDirection: ci % 2 ? "reverse" : "normal", animationDelay: `${-ci * 9}s` }}
            >
              {[...col, ...col, ...col, ...col].map((tile, i) => (
                <TileView key={i} tile={tile} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import {
  CheckmarkBadge01Icon,
  FavouriteIcon,
  InstagramIcon,
  PlayIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Right half of the auth screens: a collage of marketplace "pieces" (views stat, creator dot
 * matrix, a campaign card, a reel) around the tagline. Decorative only — aria-hidden, static
 * (auth screens are seen rarely; per Emil's gate no looping motion). Desktop only.
 */
export function AuthShowcase() {
  const t = useTranslations("auth.panel");
  return (
    <div
      aria-hidden
      className="relative hidden h-full min-h-[640px] overflow-hidden rounded-[2rem] bg-muted select-none lg:block"
    >
      {/* Top-left: coral views tile on a blueprint grid */}
      <div className="absolute top-0 left-0 h-[34%] w-[46%] overflow-hidden bg-primary [background-image:linear-gradient(to_right,oklch(1_0_0/0.14)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.14)_1px,transparent_1px)] [background-size:32px_32px] text-primary-foreground">
        <div className="absolute inset-x-6 bottom-6 flex items-end gap-1.5">
          {[28, 40, 34, 52, 46, 68, 60, 82, 74, 96].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-md bg-white/30" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="absolute top-6 left-6">
          <p className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">48.2K</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/80">
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
            {t("views")}
          </p>
        </div>
      </div>

      {/* Top-right: creators who applied, as a dot matrix */}
      <div className="absolute top-0 right-0 w-[38%] rounded-bl-3xl bg-card p-6 shadow-(--shadow-soft)">
        <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums">36</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("applicants")}</p>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Legend tone="bg-sun" label="Reels" />
          <Legend tone="bg-mint" label="Stories" />
          <Legend tone="bg-sky" label="UGC" />
        </div>
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {DOTS.map((tone, i) => (
            <span key={i} className={cn("aspect-square rounded-full", tone)} />
          ))}
        </div>
      </div>

      {/* Middle: tagline */}
      <p className="absolute top-[47%] left-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2 text-center text-4xl font-semibold tracking-[-0.035em] text-balance text-foreground/25 xl:text-5xl">
        {t("tagline")}
        <span className="ml-1 inline-block size-3 rounded-[3px] bg-primary align-baseline" />
      </p>

      {/* Bottom-left: halftone tile + a reel */}
      <div className="absolute bottom-0 left-0 h-[30%] w-[26%] bg-sky [background-image:radial-gradient(var(--sky-ink)_1px,transparent_1.2px)] [background-size:7px_7px] opacity-70" />
      <div className="absolute bottom-0 left-[16%] flex h-[24%] w-[24%] flex-col justify-between bg-sun p-4 text-sun-ink">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} className="size-4" />
          @aysel.ugc
        </div>
        <span className="flex size-12 items-center justify-center self-center rounded-full bg-white/70 shadow-(--shadow-soft)">
          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-5 translate-x-px" />
        </span>
        <div className="flex items-center gap-1 text-xs tabular-nums">
          <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-3.5" />
          2.4K
        </div>
      </div>

      {/* Bottom-right: campaign card */}
      <div className="absolute right-0 bottom-0 w-[44%] rounded-tl-3xl bg-card p-5 shadow-(--shadow-raised)">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">
            B
          </span>
          <span className="text-sm font-medium">{t("brand")}</span>
          <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-4 text-primary" />
        </div>
        <p className="mt-3 font-semibold tracking-[-0.02em]">{t("campaign")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="rose">
            <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} />
            Reels
          </Badge>
          <Badge variant="mint">{t("barter")}</Badge>
          <Badge variant="sun">{t("deadline")}</Badge>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {["Aysel", "Tural", "Nigar", "Elvin"].map((n) => (
              <NamedAvatar key={n} name={n} size="sm" single className="ring-2 ring-card" />
            ))}
          </div>
          <span className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground">
            {t("apply")}
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("size-2 rounded-full", tone)} />
      {label}
    </span>
  );
}

// Fixed pattern (no randomness → no hydration mismatch).
const S = "bg-sun",
  M = "bg-mint",
  K = "bg-sky",
  E = "bg-foreground/[0.06]";
const DOTS = [S, M, K, E, S, M, M, S, K, S, E, K, E, M, K, S, M, S, S, K, M, E, K, M];

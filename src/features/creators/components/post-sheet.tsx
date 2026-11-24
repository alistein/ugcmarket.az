"use client";

import { ArrowUpRight01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InfoTip } from "@/components/shared/info-tip";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { type CreatorPublic, postCover, postNumbers } from "../hooks";
import { NETWORK_ICON, NETWORK_TINT } from "./profile-sections";

type Item = CreatorPublic["portfolio_items"][number];

const NETWORK_NAME = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" } as const;

const statsOf = (item: Item) => {
  const raw = item.portfolio_item_stats;
  return Array.isArray(raw) ? raw[0] : raw;
};

/** 36.46 → "0:36". */
const duration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
/** ISO → "21.11.2026" (locale month names are unreliable for az). */
const date = (iso: string) => iso.slice(0, 10).split("-").reverse().join(".");

/**
 * One portfolio post in full: the cover, every checked number and the details brands look at
 * (caption, tagged accounts, audio, paid partnership), plus a link to the post itself.
 * Numbers follow the same rule as the tile: shown only for the creator's own posts.
 */
export function PostSheet({
  item,
  creator,
  onClose,
  explainMismatch,
}: {
  item: Item | null;
  creator: Pick<CreatorPublic, "creator_socials">;
  onClose: () => void;
  /** Owner view: say why numbers are hidden for someone else's post. */
  explainMismatch?: boolean;
}) {
  const desktop = useMediaQuery("(min-width: 640px)");
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        className="data-[side=bottom]:max-h-[calc(100dvh-0.5rem)] sm:max-w-md!"
      >
        {item && <PostDetails item={item} creator={creator} explainMismatch={explainMismatch} />}
      </SheetContent>
    </Sheet>
  );
}

function PostDetails({
  item,
  creator,
  explainMismatch,
}: {
  item: Item;
  creator: Pick<CreatorPublic, "creator_socials">;
  explainMismatch?: boolean;
}) {
  const t = useTranslations("creator.post");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const [more, setMore] = useState(false);
  const st = statsOf(item);
  const own = postNumbers(creator, item);
  const cover = postCover(item);
  const network = NETWORK_NAME[item.network];

  const engagement =
    own?.views && (own.likes != null || own.comments != null)
      ? (((own.likes ?? 0) + (own.comments ?? 0)) / own.views) * 100
      : null;

  const stats = own
    ? ([
        own.views != null && { label: t("views"), value: compact.format(own.views) },
        own.likes != null && { label: t("likes"), value: compact.format(own.likes) },
        own.comments != null && { label: t("comments"), value: compact.format(own.comments) },
        engagement != null && {
          label: t("engagement"),
          value: `${engagement.toFixed(1)}%`,
          hint: t("engagementHint"),
        },
        st?.duration_seconds != null && {
          label: t("duration"),
          value: duration(Number(st.duration_seconds)),
        },
        st?.posted_at && { label: t("posted"), value: date(st.posted_at) },
      ].filter(Boolean) as { label: string; value: string; hint?: string }[])
    : [];

  return (
    <>
      <SheetHeader className="pb-3">
        <SheetTitle className="text-lg font-semibold">{item.title || t("title", { network })}</SheetTitle>
        {st?.owner_handle && <p className="text-sm text-muted-foreground">@{st.owner_handle}</p>}
      </SheetHeader>

      <div className="grid flex-1 content-start gap-6 overflow-y-auto px-6 pb-2">
        <PostMedia item={item} cover={cover} />

        {stats.length > 0 ? (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-4">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  {s.label}
                  {s.hint && <InfoTip text={s.hint} label={s.label} />}
                </dt>
                <dd className="mt-0.5 text-lg font-semibold tracking-[-0.02em] tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-pretty text-muted-foreground">
            {explainMismatch && st?.fetched_at && st.owner_handle
              ? t("notYours", { owner: st.owner_handle })
              : t("noStats")}
          </p>
        )}

        {(st?.paid_partnership || st?.music) && (
          <div className="flex flex-wrap gap-1.5">
            {st.paid_partnership && <Badge variant="sun">{t("paidPartnership")}</Badge>}
            {st.music && <Badge variant="secondary">♪ {st.music}</Badge>}
          </div>
        )}

        {!!st?.mentions?.length && (
          <div className="grid gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("mentions")}</p>
            <div className="flex flex-wrap gap-1.5">
              {st.mentions.map((m) => (
                <Badge key={m} variant="secondary">
                  @{m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {st?.caption && (
          <div className="grid gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("caption")}</p>
            <p
              className={cn(
                "text-sm text-pretty break-words whitespace-pre-line text-foreground/85",
                !more && "line-clamp-5",
              )}
            >
              {st.caption}
            </p>
            {st.caption.length > 220 && (
              <button
                type="button"
                onClick={() => setMore((m) => !m)}
                className="w-fit text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
              >
                {more ? t("less") : t("more")}
              </button>
            )}
            {!!st.hashtags?.length && (
              <p className="text-sm text-muted-foreground">{st.hashtags.map((h) => `#${h}`).join(" ")}</p>
            )}
          </div>
        )}
      </div>

      <SheetFooter>
        <Button
          size="lg"
          nativeButton={false}
          render={<a href={item.url} target="_blank" rel="noopener noreferrer nofollow" />}
        >
          {t("open", { network })}
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </SheetFooter>
    </>
  );
}

/** Where the network's own player for a post lives (public posts only). */
function embedUrl(item: Item) {
  const u = item.url;
  if (item.network === "instagram") {
    const code = u.match(/instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|p|tv)\/([\w-]+)/)?.[1];
    return code ? `https://www.instagram.com/reel/${code}/embed` : null;
  }
  if (item.network === "youtube") {
    const id = u.match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
  }
  const id = u.match(/tiktok\.com\/.*\/video\/(\d+)/)?.[1];
  return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
}

/**
 * The cover with a play button; tapping swaps in the network's official player (nothing is
 * loaded from Instagram until then, so the sheet opens fast and nothing is tracked on open).
 */
function PostMedia({ item, cover }: { item: Item; cover: string | null }) {
  const t = useTranslations("creator.post");
  const [playing, setPlaying] = useState(false);
  const src = embedUrl(item);
  // Fixed 9:16 box (26rem × 14.625rem). A max-height plus aspect-ratio let the grid row come out
  // shorter than the media, so it overlapped the numbers below.
  const frame = "block h-[26rem] w-[14.625rem] shrink-0 overflow-hidden rounded-2xl bg-muted";

  if (playing && src)
    return (
      <div className="flex justify-center">
        <iframe
          src={src}
          title={t("player")}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className={cn(frame, "border-0 bg-card")}
        />
      </div>
    );

  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled={!src}
        onClick={() => setPlaying(true)}
        aria-label={t("play")}
        className={cn(
          frame,
          "group relative outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-default",
        )}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- our own storage URL
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                NETWORK_TINT[item.network],
              )}
            >
              <HugeiconsIcon icon={NETWORK_ICON[item.network]} strokeWidth={2} className="size-6" />
            </span>
          </span>
        )}
        {src && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm [transition:scale_160ms_var(--ease-out)] group-active:scale-[0.97]">
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-6 translate-x-0.5" />
            </span>
          </span>
        )}
      </button>
    </div>
  );
}

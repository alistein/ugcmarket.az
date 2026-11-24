"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Add01Icon, Delete02Icon, FavouriteIcon, Loading03Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api-client";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { checkPortfolioUrl, PortfolioItemInput } from "@/schemas";
import {
  type CreatorPublic,
  postCover,
  postNumbers,
  useAddPortfolioItem,
  useRemovePortfolioItem,
} from "../hooks";
import { PostSheet } from "./post-sheet";
import { NETWORK_ICON, NETWORK_TINT } from "./profile-sections";

/** Three slots are shown from the start (a complete profile needs 3), then a + tile up to the limit. */
const SLOTS = 3;

/** Links to the creator's best posts (we don't host video). Saved immediately, not with the form. */
export function PortfolioEditor({
  items,
  creator,
  readOnly,
}: {
  items: CreatorPublic["portfolio_items"];
  /** Used to show a post's numbers only when it belongs to the creator's own account. */
  creator: Pick<CreatorPublic, "creator_socials">;
  /** Public profile: the same grid, without empty slots, "+" or delete. */
  readOnly?: boolean;
}) {
  const t = useTranslations("creator.portfolio");
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const empty = readOnly ? 0 : Math.max(0, SLOTS - items.length);
  // No upper limit: after the first three slots there is always one more "+" tile.
  const canAddMore = !readOnly && items.length >= SLOTS;

  return (
    <div className="grid grid-cols-1 gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <PortfolioTile
              item={item}
              creator={creator}
              onOpen={() => setViewing(item.id)}
              removable={!readOnly}
            />
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`empty-${i}`}>
            <button type="button" onClick={() => setOpen(true)} className={cn(slotClass, "items-stretch")}>
              <span className="flex size-9 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                <HugeiconsIcon icon={NETWORK_ICON.instagram} strokeWidth={2} className="size-4" />
              </span>
              <span className="flex flex-1 items-center justify-center px-2 text-center text-sm text-balance text-muted-foreground">
                {t("slotEmpty")}
              </span>
            </button>
          </li>
        ))}
        {canAddMore && (
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("addMore")}
              className={cn(slotClass, "items-center justify-center gap-2 text-muted-foreground")}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
              </span>
              <span className="px-2 text-center text-xs text-balance">{t("addMore")}</span>
            </button>
          </li>
        )}
      </ul>
      {!readOnly && <AddPortfolioSheet open={open} onOpenChange={setOpen} />}
      <PostSheet
        item={items.find((i) => i.id === viewing) ?? null}
        creator={creator}
        onClose={() => setViewing(null)}
        explainMismatch={!readOnly}
      />
    </div>
  );
}

const slotClass =
  "flex aspect-[3/4] w-full flex-col rounded-2xl border border-dashed border-border p-3 outline-none transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-4 focus-visible:ring-ring/25";

function PortfolioTile({
  item,
  creator,
  onOpen,
  removable = true,
}: {
  item: CreatorPublic["portfolio_items"][number];
  creator: Pick<CreatorPublic, "creator_socials">;
  /** Opens the post's details sheet. */
  onOpen: () => void;
  removable?: boolean;
}) {
  const t = useTranslations("creator.portfolio");
  const tp = useTranslations("creator.post");
  const remove = useRemovePortfolioItem();
  const cover = postCover(item);
  return (
    // The whole tile is one button (an invisible layer under the delete button). It presses down
    // to 0.97 (160ms ease-out, every tap), and on pointer hover the cover drifts in a little.
    <div
      className={cn(
        "group relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl bg-muted/60 p-3",
        "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease] has-[[data-tile]:active]:scale-[0.97]",
        "has-[[data-tile]:focus-visible]:ring-4 has-[[data-tile]:focus-visible]:ring-ring/25",
        cover ? "text-white" : "hover:bg-muted",
      )}
    >
      {cover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own storage URL, small cover */}
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover [transition:scale_300ms_var(--ease-out)] group-hover:scale-[1.04]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent"
          />
        </>
      )}
      <div className="relative flex items-start justify-between gap-1">
        {/* The cover already shows what it is; the network chip is only for link-only tiles. */}
        {cover ? (
          <span />
        ) : (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              NETWORK_TINT[item.network],
            )}
          >
            <HugeiconsIcon icon={NETWORK_ICON[item.network]} strokeWidth={2} className="size-4" />
          </span>
        )}
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("remove")}
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id)}
            className={cn(
              "relative z-10",
              cover && "bg-black/40 text-white hover:bg-black/60 hover:text-white",
            )}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </Button>
        )}
      </div>
      <button
        type="button"
        data-tile
        onClick={onOpen}
        aria-label={item.title || tp("title", { network: NETWORK_LABEL[item.network] })}
        className="absolute inset-0 z-[1] cursor-pointer rounded-2xl outline-none"
      />
      <div className="pointer-events-none relative mt-auto min-w-0">
        {/* With a cover, the picture says what it is; the link text would only cover it. */}
        {!cover && (
          <span className="line-clamp-3 text-sm font-medium text-pretty break-words">
            {item.title || shortUrl(item.url)}
          </span>
        )}
        {cover && item.title && (
          <span className="line-clamp-2 text-sm font-medium text-pretty break-words">{item.title}</span>
        )}
        <PostStatsLine creator={creator} item={item} explainMismatch inverse={!!cover} />
      </div>
    </div>
  );
}

const NETWORK_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" } as const;

/** API errors about the link itself: shown under the field, not as a toast. */
const LINK_ERRORS = new Set([
  "portfolio_not_found",
  "portfolio_private",
  "portfolio_not_video",
  "portfolio_duplicate",
  "portfolio_not_yours",
]);

function AddPortfolioSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("creator.portfolio");
  const te = useTranslations();
  const add = useAddPortfolioItem();
  const desktop = useMediaQuery("(min-width: 640px)");
  const form = useForm<PortfolioItemInput>({
    resolver: zodResolver(PortfolioItemInput) as never,
    defaultValues: { url: "", title: "" },
  });
  const url = useWatch({ control: form.control, name: "url" });
  const checked = url ? checkPortfolioUrl(url) : null;
  const detected = checked?.ok ? checked.network : null;

  const submit = form.handleSubmit((v) =>
    add.mutate(
      { url: v.url, title: v.title || undefined },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
        onError: (e) => {
          // Problems with this link (gone, private account, a photo, already added, portfolio
          // full) belong under the field with what to do; anything else is a toast.
          if (e instanceof ApiClientError && LINK_ERRORS.has(e.code)) {
            form.setError("url", { message: e.message }, { shouldFocus: true });
            return;
          }
          const key = e instanceof ApiClientError ? e.message : "errors.unknown";
          toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
        },
      },
    ),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        className="data-[side=bottom]:h-[calc(100dvh-0.5rem)]"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">{t("dialogTitle")}</SheetTitle>
        </SheetHeader>
        <form noValidate onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-4 px-6">
            <Field
              label={t("url")}
              error={form.formState.errors.url}
              hint={
                add.isPending
                  ? t("checking")
                  : detected
                    ? t("detected", { network: t(`networks.${detected}`) })
                    : t("urlHint")
              }
            >
              {(a) => (
                <Input
                  {...a}
                  {...form.register("url")}
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  readOnly={add.isPending}
                  placeholder="https://www.instagram.com/reel/…"
                />
              )}
            </Field>
            <Field label={t("titleLabel")} error={form.formState.errors.title}>
              {(a) => <Input {...a} {...form.register("title")} placeholder={t("titlePh")} />}
            </Field>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={add.isPending}>
              <HugeiconsIcon
                icon={add.isPending ? Loading03Icon : Add01Icon}
                strokeWidth={2}
                data-icon="inline-start"
                className={add.isPending ? "animate-spin" : undefined}
              />
              {add.isPending ? t("checkingShort") : t("add")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function shortUrl(raw: string) {
  try {
    const u = new URL(raw);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return raw;
  }
}

/**
 * Views · likes of a portfolio post, checked automatically. Hidden unless the post was
 * published by the creator's own account; the owner sees why (explainMismatch).
 */
export function PostStatsLine({
  creator,
  item,
  explainMismatch,
  inverse,
}: {
  creator: Pick<CreatorPublic, "creator_socials">;
  item: CreatorPublic["portfolio_items"][number];
  explainMismatch?: boolean;
  /** White text, for use on a cover image. */
  inverse?: boolean;
}) {
  const t = useTranslations("creator.portfolio");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const n = postNumbers(creator, item);
  if (!n) {
    const raw = item.portfolio_item_stats;
    const st = Array.isArray(raw) ? raw[0] : raw;
    if (explainMismatch && st?.fetched_at && st.owner_handle) {
      return (
        <span className={cn("mt-0.5 block text-xs", inverse ? "text-white/80" : "text-muted-foreground")}>
          {t("notYours", { owner: st.owner_handle })}
        </span>
      );
    }
    return null;
  }
  return (
    <span
      className={cn(
        "mt-1 flex items-center gap-3 text-xs tabular-nums",
        inverse ? "text-white/90" : "text-muted-foreground",
      )}
      title={t("checked")}
    >
      {n.views != null && (
        <span className="inline-flex items-center gap-1">
          <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
          {compact.format(n.views)}
        </span>
      )}
      {n.likes != null && (
        <span className="inline-flex items-center gap-1">
          <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-3.5" />
          {compact.format(n.likes)}
        </span>
      )}
    </span>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Add01Icon,
  ArrowUpRight01Icon,
  Delete02Icon,
  FavouriteIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
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
import { isEnabledNetwork, networkOfUrl, PORTFOLIO_MAX, PortfolioItemInput } from "@/schemas";
import { type CreatorPublic, postNumbers, useAddPortfolioItem, useRemovePortfolioItem } from "../hooks";
import { NETWORK_ICON, NETWORK_TINT } from "./profile-sections";

/** Three slots are shown from the start (a complete profile needs 3), then a + tile up to the limit. */
const SLOTS = 3;

/** Links to the creator's best posts (we don't host video). Saved immediately, not with the form. */
export function PortfolioEditor({
  items,
  creator,
}: {
  items: CreatorPublic["portfolio_items"];
  /** Used to show a post's numbers only when it belongs to the creator's own account. */
  creator: Pick<CreatorPublic, "creator_socials">;
}) {
  const t = useTranslations("creator.portfolio");
  const [open, setOpen] = useState(false);
  const empty = Math.max(0, SLOTS - items.length);
  const canAddMore = items.length >= SLOTS && items.length < PORTFOLIO_MAX;

  return (
    <div className="grid grid-cols-1 gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <PortfolioTile item={item} creator={creator} />
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
      {items.length >= PORTFOLIO_MAX && (
        <p className="text-sm text-muted-foreground">{t("full", { max: PORTFOLIO_MAX })}</p>
      )}
      <AddPortfolioSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}

const slotClass =
  "flex aspect-[3/4] w-full flex-col rounded-2xl border border-dashed border-border p-3 outline-none transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-4 focus-visible:ring-ring/25";

function PortfolioTile({
  item,
  creator,
}: {
  item: CreatorPublic["portfolio_items"][number];
  creator: Pick<CreatorPublic, "creator_socials">;
}) {
  const t = useTranslations("creator.portfolio");
  const remove = useRemovePortfolioItem();
  return (
    <div className="group relative flex aspect-[3/4] w-full flex-col rounded-2xl bg-muted/60 p-3">
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            NETWORK_TINT[item.network],
          )}
        >
          <HugeiconsIcon icon={NETWORK_ICON[item.network]} strokeWidth={2} className="size-4" />
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("remove")}
          disabled={remove.isPending}
          onClick={() => remove.mutate(item.id)}
          className="relative z-10"
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        </Button>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-auto min-w-0 outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-4 focus-visible:after:ring-ring/25"
      >
        <span className="line-clamp-3 text-sm font-medium text-pretty break-words">
          {item.title || shortUrl(item.url)}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-muted-foreground">
          {t("open")}
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3" />
        </span>
        <PostStatsLine creator={creator} item={item} explainMismatch />
      </a>
    </div>
  );
}

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
  const found = url ? networkOfUrl(url.trim()) : null;
  const detected = found && isEnabledNetwork(found) ? found : null;

  const submit = form.handleSubmit((v) =>
    add.mutate(
      { url: v.url, title: v.title || undefined },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
        onError: (e) => {
          const key = e instanceof ApiClientError ? e.message : "errors.unknown";
          toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
        },
      },
    ),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={desktop ? "right" : "bottom"} className="data-[side=bottom]:h-[calc(100dvh-0.5rem)]">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">{t("dialogTitle")}</SheetTitle>
        </SheetHeader>
        <form noValidate onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="grid gap-4 px-6">
            <Field
              label={t("url")}
              error={form.formState.errors.url}
              hint={detected ? t("detected", { network: t(`networks.${detected}`) }) : t("urlHint")}
            >
              {(a) => (
                <Input
                  {...a}
                  {...form.register("url")}
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoFocus
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
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("add")}
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
}: {
  creator: Pick<CreatorPublic, "creator_socials">;
  item: CreatorPublic["portfolio_items"][number];
  explainMismatch?: boolean;
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
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {t("notYours", { owner: st.owner_handle })}
        </span>
      );
    }
    return null;
  }
  return (
    <span
      className="mt-1 flex items-center gap-3 text-xs text-muted-foreground tabular-nums"
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

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
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { isEnabledNetwork, networkOfUrl, PortfolioItemInput } from "@/schemas";
import { type CreatorPublic, postNumbers, useAddPortfolioItem, useRemovePortfolioItem } from "../hooks";
import { NETWORK_ICON, NETWORK_TINT } from "./profile-sections";

const MAX = 12;

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
  const te = useTranslations();
  const add = useAddPortfolioItem();
  const remove = useRemovePortfolioItem();
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
        onSuccess: () => form.reset(),
        onError: (e) => {
          const key = e instanceof ApiClientError ? e.message : "errors.unknown";
          toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
        },
      },
    ),
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  NETWORK_TINT[item.network],
                )}
              >
                <HugeiconsIcon icon={NETWORK_ICON[item.network]} strokeWidth={2} className="size-4" />
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium">{item.title || shortUrl(item.url)}</span>
                {item.title && (
                  <span className="block truncate text-xs text-muted-foreground">{shortUrl(item.url)}</span>
                )}
                <PostStatsLine creator={creator} item={item} explainMismatch />
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("open")}
                nativeButton={false}
                render={<a href={item.url} target="_blank" rel="noopener noreferrer nofollow" />}
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("remove")}
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {items.length < MAX ? (
        <form
          noValidate
          onSubmit={submit}
          className="grid gap-3 rounded-2xl border border-dashed border-border p-4"
        >
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
                placeholder="https://www.instagram.com/reel/…"
              />
            )}
          </Field>
          <Field label={t("titleLabel")} error={form.formState.errors.title}>
            {(a) => <Input {...a} {...form.register("title")} placeholder={t("titlePh")} />}
          </Field>
          <Button type="submit" variant="soft" disabled={add.isPending} className="w-fit">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            {t("add")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("full", { max: MAX })}</p>
      )}
    </div>
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

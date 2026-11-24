"use client";

import { Add01Icon, Alert02Icon, Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/shared/loading-state";
import { PublicHeader } from "@/components/shared/public-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/me/hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CITIES, LISTING_COMPENSATION_TYPES } from "@/schemas";
import { useCampaignBoard, viewerKey } from "../hooks";
import { ListingCard } from "./listing-card";

type PayType = (typeof LISTING_COMPENSATION_TYPES)[number];
type City = (typeof CITIES)[number];

const isPay = (v: string | null): v is PayType =>
  !!v && (LISTING_COMPENSATION_TYPES as readonly string[]).includes(v);
const isCity = (v: string | null): v is City => !!v && (CITIES as readonly string[]).includes(v);

/**
 * /campaigns: the public elan board. Everyone can browse; what changes by viewer (pay, "Applied",
 * "Yours") comes from the server. Filters live in the URL so a filtered board can be shared.
 * Decisions: wiki campaign-board, "Public board decisions (2026-11-24)".
 */
export function ListingBoardView() {
  const t = useTranslations("board");
  const params = useSearchParams();
  const router = useRouter();
  const { data: me, isPending: meLoading } = useMe();

  const pay = params.get("compensation_type");
  const city = params.get("city");
  const filters = {
    ...(isPay(pay) && { compensation_type: pay }),
    ...(isCity(city) && { city }),
  };
  const filtered = Object.keys(filters).length > 0;

  const board = useCampaignBoard(filters, viewerKey(me));
  const items = board.data?.pages.flatMap((p) => p.items) ?? [];
  const total = board.data?.pages[0]?.total ?? 0;

  const setFilter = (key: "compensation_type" | "city", value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace({ pathname: "/campaigns", query: Object.fromEntries(next) }, { scroll: false });
  };
  const clear = () => router.replace("/campaigns", { scroll: false });

  const isBrand = me?.role === "brand";
  const loading = meLoading || board.isPending;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-4" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-16">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-pretty text-muted-foreground">
              {board.data ? (
                <span className="font-medium text-foreground tabular-nums">
                  {t("count", { count: total })}
                </span>
              ) : null}
              {board.data ? " · " : null}
              {t("sub")}
            </p>
          </div>
          {isBrand && me.brand && (
            <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("post")}
            </Button>
          )}
        </div>

        <CreatorNote />

        <Filters pay={isPay(pay) ? pay : null} city={isCity(city) ? city : null} onChange={setFilter} />

        {loading ? (
          <CardGridSkeleton />
        ) : board.isError ? (
          <div className="py-16 text-center">
            <p className="flex items-center justify-center gap-2 text-destructive">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
              {t("error")}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => board.refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          filtered ? (
            <Empty title={t("noResultsTitle")} body={t("noResultsBody")}>
              <Button variant="outline" onClick={clear}>
                {t("clear")}
              </Button>
            </Empty>
          ) : (
            <Empty title={t("emptyTitle")} body={t("emptyBody")}>
              {isBrand && me.brand && (
                <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
                  {t("emptyBrand")}
                </Button>
              )}
            </Empty>
          )
        ) : (
          <>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <li key={c.id} className="min-w-0">
                  <Link
                    href={`/campaigns/${c.slug ?? c.id}`}
                    className="group/card block h-full rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
                  >
                    <ListingCard
                      data={{ ...c, brand: c.brand ?? { name: "", logo_url: null } }}
                      className="h-full [transition:scale_160ms_var(--ease-out),box-shadow_200ms_ease] group-active/card:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:shadow-(--shadow-float)"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            {board.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => board.fetchNextPage()}
                  disabled={board.isFetchingNextPage}
                >
                  {t("more")}
                </Button>
              </div>
            )}
          </>
        )}

        {!meLoading && !me && <GuestPrompt />}
      </main>
    </div>
  );
}

/** Pay type as chips (the filter creators use most), city as a select (long list). */
function Filters({
  pay,
  city,
  onChange,
}: {
  pay: PayType | null;
  city: City | null;
  onChange: (key: "compensation_type" | "city", value: string | null) => void;
}) {
  const t = useTranslations("board");
  const tt = useTranslations("taxonomy");
  const chip = (on: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm select-none",
      "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease,color_150ms_ease] active:scale-[0.97]",
      "outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
      on
        ? "bg-foreground text-background"
        : "bg-muted text-foreground hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
    );
  const options: (PayType | null)[] = [null, ...LISTING_COMPENSATION_TYPES];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {/* Scrolls sideways on phones instead of wrapping into three rows. */}
      <div
        role="radiogroup"
        aria-label={t("payType")}
        className="-mx-4 flex min-w-0 flex-1 basis-full [scrollbar-width:none] gap-2 overflow-x-auto overscroll-x-contain px-4 sm:mx-0 sm:basis-auto sm:px-0"
      >
        {options.map((o) => {
          const on = o === pay;
          return (
            <button
              key={o ?? "all"}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange("compensation_type", o)}
              className={chip(on)}
            >
              {on && o && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />}
              {o ? tt(`compensation.${o}`) : t("all")}
            </button>
          );
        })}
      </div>
      <Select
        items={[
          { value: "any", label: t("anyCity") },
          ...CITIES.map((c) => ({ value: c, label: tt(`cities.${c}`) })),
        ]}
        value={city ?? "any"}
        onValueChange={(v) => onChange("city", !v || v === "any" ? null : v)}
      >
        <SelectTrigger aria-label={t("city")} className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">{t("anyCity")}</SelectItem>
          {CITIES.map((c) => (
            <SelectItem key={c} value={c}>
              {tt(`cities.${c}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Creators who can't apply yet hear why, once, above the list (D2, D14). */
function CreatorNote() {
  const t = useTranslations("board");
  const { data: me } = useMe();
  if (me?.role !== "creator") return null;
  if (!me.creator)
    return (
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {t("createProfileNote")}
        <Link href="/me/profile" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("createProfileCta")}
        </Link>
      </p>
    );
  if (me.creator.review_status !== "approved")
    return (
      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
        {t("pendingNote")}
      </p>
    );
  return null;
}

function Empty({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <p className="text-lg font-semibold tracking-[-0.02em]">{title}</p>
      <p className="mt-1 text-pretty text-muted-foreground">{body}</p>
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}

/** Under the list for signed-out visitors: the board's one sign-up push, aimed at creators (D1). */
function GuestPrompt() {
  const t = useTranslations("board");
  return (
    <section className="mt-14 border-t border-border/70 pt-10 text-center">
      <h2 className="text-xl font-semibold tracking-[-0.025em] text-balance">{t("guestTitle")}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-pretty text-muted-foreground">{t("guestBody")}</p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href={{ pathname: "/signup", query: { role: "creator" } }} />}
        >
          {t("guestCta")}
        </Button>
        <Link
          href={{ pathname: "/signup", query: { role: "brand" } }}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("forBrands")}
        </Link>
      </div>
    </section>
  );
}

/** Three cards in the card's shape: brand row, title, pay, formats, footer. */
function CardGridSkeleton() {
  return (
    <LoadingState className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl bg-card p-5 shadow-(--shadow-raised)">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-[28%]" />
            <div className="grid gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
          <Skeleton className="mt-4 h-6 w-4/5" />
          <Skeleton className="mt-3 h-8 w-28" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-full" />
        </div>
      ))}
    </LoadingState>
  );
}

"use client";

import {
  ArrowLeft01Icon,
  LockIcon,
  Calendar03Icon,
  Clock01Icon,
  InstagramIcon,
  Location01Icon,
  PencilEdit02Icon,
  Share08Icon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { PublicHeader } from "@/components/shared/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyBrand } from "@/features/brands/hooks";
import { useMe } from "@/features/me/hooks";
import { ApplyBlock } from "@/features/applications/components/apply-block";
import { Link } from "@/i18n/navigation";
import { BRAND_CATEGORIES, CITIES, CREATOR_CATEGORIES } from "@/schemas";
import { type CampaignDetail, useCampaign, useOwnCampaign, viewerKey } from "../hooks";
import { useShareListing } from "../share";
import { Pay } from "./listing-card";

const known = <T extends string>(list: readonly T[], v: string | null | undefined): v is T =>
  !!v && (list as readonly string[]).includes(v);

/**
 * /campaigns/[id] — the public listing page. Published listings load for everyone; the brand
 * that owns a draft / in-review / paused listing sees it as a preview (nobody else can).
 */
export function ListingDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: me, isPending: meLoading } = useMe();
  const pub = useCampaign(id, viewerKey(me));
  const isBrand = me?.role === "brand" && !!me.brand;
  const own = useOwnCampaign(id, isBrand && pub.isError);
  const brand = useMyBrand(isBrand && pub.isError);

  let data: CampaignDetail | null = null;
  let preview = false;
  if (pub.data) data = pub.data;
  else if (own.data && brand.data) {
    preview = true;
    data = {
      ...own.data,
      title: own.data.title ?? "",
      description: own.data.description ?? "",
      category: own.data.category ?? "",
      deadline: own.data.deadline ?? "",
      brand: {
        id: brand.data.id,
        name: brand.data.name,
        logo_url: brand.data.logo_url,
        category: brand.data.category,
      },
    } as CampaignDetail;
  }

  const loading =
    meLoading || pub.isPending || (isBrand && pub.isError && (own.isPending || brand.isPending));
  const isOwner = !!data && !!me?.brand && data.brand_id === me.brand.id;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-4" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-16">
        {data ? (
          <Listing data={data} preview={preview} isOwner={isOwner} />
        ) : loading ? (
          <DetailSkeleton />
        ) : (
          <NotFound />
        )}
      </main>
    </div>
  );
}

/** Mirrors Listing: back + brand row, title, topic, price, formats, 4 facts, description, requirements. */
function DetailSkeleton() {
  return (
    <LoadingState>
      <div className="flex items-center gap-3">
        <Skeleton className="-ml-2 size-10 shrink-0 rounded-full" />
        <Skeleton className="size-12 shrink-0 rounded-[28%]" />
        <div className="grid gap-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="mt-6 h-9 w-full max-w-xl sm:h-10" />
      <Skeleton className="mt-3 h-5 w-24" />
      <Skeleton className="mt-3 h-9 w-36" />
      <Skeleton className="mt-1.5 h-4 w-64 max-w-full" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border/70 py-6 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="mt-8 grid gap-2.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </LoadingState>
  );
}

function NotFound() {
  const t = useTranslations("listing");
  return (
    <div className="mx-auto max-w-sm py-20 text-center">
      <p className="text-lg font-semibold tracking-[-0.02em]">{t("notFoundTitle")}</p>
      <p className="mt-1 text-pretty text-muted-foreground">{t("notFoundBody")}</p>
      <Button className="mt-6" nativeButton={false} render={<Link href="/campaigns" />}>
        {t("browse")}
      </Button>
    </div>
  );
}

/** Only what a creator needs to decide: who, what, for how much, by when, and the brief. */
function Listing({
  data: d,
  preview,
  isOwner,
}: {
  data: CampaignDetail;
  preview: boolean;
  isOwner: boolean;
}) {
  const t = useTranslations("listing");
  const tt = useTranslations("taxonomy");
  const tm = useTranslations("campaign.mine");
  const ta = useTranslations("listing.apply");
  const share = useShareListing();
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const deadline = d.deadline ? d.deadline.split("-").reverse().join(".") : null;
  const live = d.status === "published" || d.status === "paused" || d.status === "closed";

  const facts = [
    {
      icon: Location01Icon,
      label: t("city"),
      value: known(CITIES, d.city) ? tt(`cities.${d.city}`) : t("anyCity"),
    },
    deadline && { icon: Calendar03Icon, label: t("deadline"), value: deadline },
    {
      icon: UserGroupIcon,
      label: t("minFollowers"),
      value: d.min_followers > 0 ? `${compact.format(d.min_followers)}+` : t("anyone"),
    },
    { icon: UserMultiple02Icon, label: t("creatorsNeeded"), value: String(d.creators_needed) },
  ].filter(Boolean) as { icon: typeof Location01Icon; label: string; value: string }[];

  return (
    <article>
      {preview && (
        <p className="mb-6 flex items-start gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {t("previewNote", { status: tm(`status.${d.status}`) })}
        </p>
      )}

      {d.brand && (
        <div className="flex items-center gap-3">
          {/* Back: owners came from their dashboard, everyone else from the board. */}
          <Link
            href={isOwner ? "/brand" : "/campaigns"}
            aria-label={t("back")}
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/80 outline-none [transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
          </Link>
          <NamedAvatar name={d.brand.name} src={d.brand.logo_url} square className="size-12" />
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-[-0.02em]">{d.brand.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {known(BRAND_CATEGORIES, d.brand.category)
                ? tt(`brandCategories.${d.brand.category}`)
                : d.brand.category}
            </p>
          </div>
        </div>
      )}

      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-balance break-words sm:text-4xl">
        {d.title}
      </h1>
      {known(CREATOR_CATEGORIES, d.category) && (
        <p className="mt-2 text-muted-foreground">{tt(`categories.${d.category}`)}</p>
      )}

      {d.pay_hidden ? (
        <HiddenPay campaignId={d.id} reason={d.pay_hidden} currency={d.currency} />
      ) : (
        <Pay data={d} />
      )}

      {d.deliverables.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {d.deliverables.map((x, i) => (
            <Badge key={x.format} variant="sky">
              {i === 0 && <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} />}
              {tt(`formats.${x.format}` as never)}
              {x.count > 1 && <span className="tabular-nums">× {x.count}</span>}
            </Badge>
          ))}
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border/70 py-6 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={f.icon} strokeWidth={2} className="size-3.5 shrink-0" />
              {f.label}
            </dt>
            <dd className="mt-1 truncate font-medium tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      {/* Creators act right after the key facts; owners and previews don't apply. */}
      {d.ended && !preview ? (
        <p className="mt-6 flex items-start gap-2 text-sm text-pretty text-muted-foreground">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {t("ended")}
        </p>
      ) : (
        d.status === "published" &&
        !isOwner && (
          <div className="mt-6 grid gap-3">
            {/* Under the minimum: a heads-up, not a block. The brand decides (D10). */}
            {d.below_min_followers && (
              <p className="flex items-start gap-2 text-sm text-pretty text-muted-foreground">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                {ta("belowMin", { count: compact.format(d.min_followers) })}
              </p>
            )}
            <ApplyBlock
              campaignId={d.id}
              bidCurrency={d.compensation_type === "bid" ? d.currency : undefined}
            />
          </div>
        )
      )}

      {d.description && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{t("description")}</h2>
          <p className="mt-2 text-pretty break-words whitespace-pre-line text-foreground/85">
            {d.description}
          </p>
        </section>
      )}
      {d.requirements && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">{t("requirements")}</h2>
          <p className="mt-2 text-pretty break-words whitespace-pre-line text-foreground/85">
            {d.requirements}
          </p>
        </section>
      )}

      {isOwner && (
        <div className="mt-10 flex flex-wrap gap-3 border-t border-border/70 pt-6">
          {live && (
            <Button nativeButton={false} render={<Link href={`/brand/campaigns/${d.id}/applicants`} />}>
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} data-icon="inline-start" />
              {t("applicants")}
            </Button>
          )}
          {d.status === "published" && (
            <Button variant="outline" onClick={() => share(d)}>
              <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
              {t("share")}
            </Button>
          )}
          {d.status !== "closed" && (
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href={`/brand/campaigns/${d.id}/edit`} />}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
              {t("edit")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Pay the server left out: a blurred stand-in (not the real amount; it was never sent). Signed-out
 * visitors get a log-in link back to this listing; other brands just hear that only creators see it.
 */
function HiddenPay({
  campaignId,
  reason,
  currency,
}: {
  campaignId: string;
  reason: "signed_out" | "brand";
  currency: string;
}) {
  const t = useTranslations("listing");
  const locale = useLocale();
  return (
    <div className="mt-3">
      {/* Only the number is blurred; the currency stays readable. */}
      <p aria-hidden className="text-3xl font-semibold tracking-[-0.035em] select-none">
        <span className="inline-block blur-[6px]">000</span>
        <span className="ml-1.5 text-base font-medium tracking-normal text-muted-foreground">{currency}</span>
      </p>
      {reason === "brand" ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-4" />
          {t("payCreators")}
        </p>
      ) : (
        <Link
          href={{ pathname: "/login", query: { next: `/${locale}/campaigns/${campaignId}` } }}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
        >
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-4" />
          {t("payLogin")}
        </Link>
      )}
    </div>
  );
}

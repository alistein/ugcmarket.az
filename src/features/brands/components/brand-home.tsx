"use client";

import {
  Alert02Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  InstagramIcon,
  Location01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { LoadingState } from "@/components/shared/loading-state";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { SetupIntro } from "@/components/shared/setup-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BRAND_CATEGORIES, type BrandCategory } from "@/schemas";
import { ListingsSkeleton, MyListings } from "@/features/campaigns/components/my-listings";
import { useMyCampaigns } from "@/features/campaigns/hooks";
import { useMe } from "@/features/me/hooks";
import { type MyBrand, useMyBrand } from "../hooks";

const STEPS = ["about", "contacts"] as const;

/** /brand — the brand's home: setup intro before the brand exists, listings after. */
export function BrandHome() {
  const t = useTranslations("common");
  const { data, isPending, isError } = useMyBrand();
  // Load the listings together with the brand, so the page shows one skeleton, not two in a row.
  const { data: me } = useMe();
  const listings = useMyCampaigns(!!me?.brand);
  if (isPending || (data && listings.isPending)) return <HomeSkeleton />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <Home brand={data} /> : <BrandSetupPrompt />;
}

/** Mirrors Home: logo + name/badge + field, edit button, review note, "Elanlarınız" + tile grid. */
function HomeSkeleton() {
  return (
    <LoadingState className="grid gap-10">
      <div className="grid gap-5">
        <div className="flex items-center gap-5">
          <Skeleton className="size-20 shrink-0 rounded-[28%]" />
          <div className="grid min-w-0 flex-1 gap-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
              <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="ml-auto hidden h-9 w-40 rounded-full sm:block" />
        </div>
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-7 w-40" />
        <ListingsSkeleton />
      </div>
    </LoadingState>
  );
}

function BrandSetupPrompt() {
  const t = useTranslations("brand.dashboard");
  const ts = useTranslations("brand.steps");
  return (
    <SetupIntro
      eyebrow={t("setupEyebrow")}
      eyebrowVariant="brand"
      title={t("setupTitle")}
      body={t("setupBody")}
      steps={STEPS.map((s) => ({ title: ts(`${s}.title`), subtitle: ts(`${s}.subtitle`) }))}
      note={t("contactRule")}
      cta={{ label: t("setupCta"), href: "/brand/profile" }}
      visual={<SetupVisual />}
    />
  );
}

function Home({ brand: b }: { brand: MyBrand }) {
  const t = useTranslations("brand.dashboard");
  const tc = useTranslations("taxonomy.brandCategories");
  return (
    <div className="grid gap-10">
      <header className="grid gap-5">
        <div className="flex items-center gap-5">
          <NamedAvatar
            name={b.name}
            src={b.logo_url}
            square
            className="size-20"
            fallbackClassName="text-2xl"
          />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              <span className="truncate">{b.name}</span>
              <StatusMark status={b.review_status} />
            </h1>
            <p className="mt-1 text-muted-foreground">
              {(BRAND_CATEGORIES as readonly string[]).includes(b.category)
                ? tc(b.category as BrandCategory)
                : b.category}
            </p>
          </div>
          <Button
            variant="ghost"
            className="ml-auto hidden sm:inline-flex"
            nativeButton={false}
            render={<Link href="/brand/profile" />}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
            {t("editProfile")}
          </Button>
        </div>
        {b.review_status !== "approved" && <StatusNote status={b.review_status} />}
      </header>

      <MyListings />
    </div>
  );
}

function StatusMark({ status }: { status: MyBrand["review_status"] }) {
  const t = useTranslations("brand.dashboard.status");
  if (status === "approved") {
    return (
      <span title={t("approved.title")} className="shrink-0 text-mint-ink">
        <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-6" />
        <span className="sr-only">{t("approved.title")}</span>
      </span>
    );
  }
  return (
    <Badge variant={status === "pending" ? "sun" : "rose"} className="shrink-0">
      {status === "pending" && <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />}
      {t(`${status}.badge`)}
    </Badge>
  );
}

function StatusNote({ status }: { status: "pending" | "rejected" }) {
  const t = useTranslations("brand.dashboard.status");
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 text-sm",
        status === "pending" ? "text-muted-foreground" : "text-destructive",
      )}
    >
      <HugeiconsIcon
        icon={status === "pending" ? Clock01Icon : Alert02Icon}
        strokeWidth={2}
        className="mt-0.5 size-4 shrink-0"
      />
      <span>
        {t(`${status}.body`)}
        {status === "rejected" && (
          <>
            {" "}
            <Link href="/brand/profile" className="font-medium underline underline-offset-4">
              {t("rejected.cta")}
            </Link>
          </>
        )}
      </span>
    </p>
  );
}

/** Decorative: a listing as creators will see it. Static (seen once), aria-hidden. */
function SetupVisual() {
  const t = useTranslations("brand.dashboard.visual");
  const brandName = t("brandName");
  return (
    <div aria-hidden className="relative mx-auto h-[26rem] w-full max-w-[26rem] select-none">
      {/* backdrop blobs */}
      <div className="absolute inset-x-6 top-6 bottom-10 rounded-[2.5rem] bg-muted" />
      <div className="absolute top-0 right-2 size-28 rounded-[2rem] bg-sky [background-image:radial-gradient(var(--sky-ink)_1px,transparent_1.2px)] [background-size:8px_8px] opacity-60" />
      <div className="absolute bottom-2 left-0 size-24 rounded-full bg-sun" />

      {/* listing card */}
      <div className="absolute top-14 left-1/2 w-[19rem] -translate-x-1/2 rotate-2 rounded-3xl bg-card p-5 shadow-(--shadow-float)">
        <div className="flex items-center gap-3">
          <NamedAvatar name={brandName} square className="size-11" />
          <div className="min-w-0">
            <p className="font-semibold tracking-[-0.02em]">{brandName}</p>
            <p className="text-sm text-muted-foreground">{t("category")}</p>
          </div>
        </div>
        <p className="mt-4 text-lg leading-snug font-semibold tracking-[-0.02em]">{t("title")}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="sky">
            <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} />
            Reels
          </Badge>
          <Badge variant="mint">150 AZN</Badge>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
            {t("city")}
          </span>
          <span>{t("deadline")}</span>
        </div>
      </div>

      {/* applicants chip */}
      <div className="absolute right-0 bottom-16 flex rotate-[4deg] items-center gap-2.5 rounded-2xl bg-card py-2.5 pr-4 pl-2.5 shadow-(--shadow-raised)">
        <div className="flex -space-x-2">
          {["Nigar", "Elvin", "Aysel"].map((n) => (
            <NamedAvatar key={n} name={n} size="sm" single className="ring-2 ring-card" />
          ))}
        </div>
        <p className="text-sm font-medium tabular-nums">{t("applicants")}</p>
      </div>

      {/* new applicant chip */}
      <div className="absolute top-4 left-0 rotate-[-5deg] rounded-full bg-foreground px-3.5 py-2 text-sm text-background shadow-(--shadow-raised)">
        {t("newApplicant")}
      </div>
    </div>
  );
}

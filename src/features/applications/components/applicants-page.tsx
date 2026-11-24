"use client";

import {
  CheckmarkBadge01Icon,
  Copy01Icon,
  InstagramIcon,
  Link01Icon,
  Location01Icon,
  PencilEdit02Icon,
  SmartPhone01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { SkeletonBack } from "@/components/shared/skeletons";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackToBrand } from "@/features/campaigns/components/campaign-form";
import { formatAmount } from "@/features/campaigns/components/listing-card";
import { type OwnCampaign, useOwnCampaign } from "@/features/campaigns/hooks";
import { type CreatorPublic, socialNumbers } from "@/features/creators/hooks";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CITIES, CREATOR_CATEGORIES, isEnabledNetwork } from "@/schemas";
import { type Applicant, useApplicants } from "../hooks";
import { CreatorTags } from "@/features/creators/components/creator-tags";
import { useCreatorWho } from "@/features/creators/who";

const STATUS_BADGE = {
  draft: "secondary",
  pending_review: "sun",
  published: "mint",
  paused: "sky",
  closed: "secondary",
  rejected: "rose",
} as const;

const known = <T extends string>(list: readonly T[], v: string | null | undefined): v is T =>
  !!v && (list as readonly string[]).includes(v);

/** /brand/campaigns/[id]/applicants — who applied, their numbers and how to reach them. */
export function ApplicantsPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const campaign = useOwnCampaign(id);
  const applicants = useApplicants(id);

  if (campaign.isPending || applicants.isPending) return <PageSkeleton />;
  if (campaign.isError || applicants.isError) {
    const err = campaign.error ?? applicants.error;
    const notFound = err instanceof ApiClientError && err.status === 404;
    return (
      <div>
        <BackToBrand />
        <p role="alert" className="text-sm text-destructive">
          {notFound ? t("errors.notFound.campaign") : t("common.loadFailed")}
        </p>
      </div>
    );
  }
  return <Applicants campaign={campaign.data} list={applicants.data} />;
}

/** Mirrors the page: back, badge + count, title, actions, then applicant cards. */
function PageSkeleton() {
  return (
    <LoadingState>
      <SkeletonBack />
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-3 h-9 w-full max-w-lg sm:h-10" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-4 w-full max-w-xl" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <ApplicantCardSkeleton key={i} />
        ))}
      </div>
    </LoadingState>
  );
}

/** Like ApplicantCard: avatar + name/city + date, two numbers, categories, note, contact rows. */
function ApplicantCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl bg-card p-5 shadow-(--shadow-soft)">
      <div className="flex items-start gap-3.5">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-1.5 pt-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="mt-4 flex gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-11/12" />
      <div className="mt-4 grid gap-2.5 border-t border-border/70 pt-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-36" />
      </div>
    </div>
  );
}

function Applicants({ campaign: c, list }: { campaign: OwnCampaign; list: Applicant[] }) {
  const t = useTranslations("applicants");
  const tm = useTranslations("campaign.mine");
  const live = c.status === "published" || c.status === "paused";
  const publicUrl = typeof window === "undefined" ? "" : `${window.location.origin}/campaigns/${c.id}`;

  return (
    <div>
      <BackToBrand />
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant={STATUS_BADGE[c.status]}>{tm(`status.${c.status}`)}</Badge>
            <span className="text-sm text-muted-foreground tabular-nums">
              {list.length} {tm("applicants", { count: list.length })}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance break-words sm:text-4xl">
            {c.title ?? tm("untitled")}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status === "published" && (
            <Button variant="ghost" onClick={() => copy(publicUrl, t("linkCopied"), t("copyFailed"))}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("copyLink")}
            </Button>
          )}
          {c.status !== "closed" && (
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href={`/brand/campaigns/${c.id}/edit`} />}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
              {t("editListing")}
            </Button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center shadow-(--shadow-soft)">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-6" />
          </span>
          <p className="mt-4 text-lg font-semibold tracking-[-0.02em]">{t("emptyTitle")}</p>
          <p className="mt-1 max-w-sm text-pretty text-muted-foreground">
            {live ? t("emptyLive") : t("emptyNotLive")}
          </p>
          {c.status === "published" && (
            <Button className="mt-6" onClick={() => copy(publicUrl, t("linkCopied"), t("copyFailed"))}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("copyLink")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-pretty text-muted-foreground">{t("contactNote")}</p>
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {list.map((a) => (
              <ApplicantCard key={a.id} applicant={a} currency={c.currency} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

async function copy(text: string, ok: string, failed: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error(failed);
  }
}

/**
 * One applicant: who they are, their bid (on bid listings), their Instagram numbers, their note,
 * and how to reach them.
 */
function ApplicantCard({ applicant: a, currency }: { applicant: Applicant; currency: string }) {
  const t = useTranslations("applicants");
  const tt = useTranslations("taxonomy");
  const who = useCreatorWho();
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const c = a.creator;
  if (!c) return null;

  const social = c.creator_socials.find((s) => isEnabledNetwork(s.network));
  const numbers = social
    ? socialNumbers(
        c as unknown as Pick<CreatorPublic, "creator_social_stats">,
        social as CreatorPublic["creator_socials"][number],
      )
    : null;
  const applied = a.created_at.slice(0, 10).split("-").reverse().join(".");
  const instagram = a.contact?.instagram;
  const phone = a.contact?.phone;

  return (
    <li className="flex flex-col rounded-3xl bg-card p-5 shadow-(--shadow-soft)">
      <div className="flex items-start gap-3.5">
        <NamedAvatar
          name={c.display_name}
          src={c.avatar_url}
          className="size-14"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/creator/${c.handle}`}
            target="_blank"
            className="block truncate font-semibold tracking-[-0.02em] hover:underline"
          >
            {c.display_name}
          </Link>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
            {known(CITIES, c.city) ? tt(`cities.${c.city}`) : c.city}
            {who(c) && <span>· {who(c)}</span>}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{applied}</span>
      </div>

      {(numbers || a.bid_amount != null) && (
        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          {a.bid_amount != null && (
            <div>
              <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                {formatAmount(a.bid_amount, locale)}
                <span className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">
                  {currency}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{t("bid")}</p>
            </div>
          )}
          {numbers && (
            <>
              <div>
                <p className="flex items-center gap-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                  {numbers.followers != null ? compact.format(numbers.followers) : "?"}
                  {numbers.checked && (
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      strokeWidth={2}
                      className="size-4 text-mint-ink"
                      aria-label={t("checked")}
                    />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{t("followers")}</p>
              </div>
              {numbers.avg_views != null && (
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                    {compact.format(numbers.avg_views)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("avgViews")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {c.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.categories.slice(0, 3).map((cat) => (
            <Badge key={cat} variant="brand">
              {known(CREATOR_CATEGORIES, cat) ? tt(`categories.${cat}`) : cat}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-2">
        <CreatorTags creator={c} limit={4} />
      </div>

      {a.message && (
        <p className="mt-4 text-sm text-pretty break-words whitespace-pre-line text-foreground/80">
          “{a.message}”
        </p>
      )}

      <div className="mt-auto grid gap-1 border-t border-border/70 pt-3 text-sm [&:not(:first-child)]:mt-4">
        {instagram && (
          <ContactRow
            icon={InstagramIcon}
            href={`https://www.instagram.com/${instagram}/`}
            value={`@${instagram}`}
            copyValue={instagram}
            external
          />
        )}
        {phone && (
          <ContactRow
            icon={SmartPhone01Icon}
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            value={phone}
            copyValue={phone}
          />
        )}
        {!instagram && !phone && <p className="text-muted-foreground">{t("noContacts")}</p>}
      </div>
    </li>
  );
}

function ContactRow({
  icon,
  href,
  value,
  copyValue,
  external,
}: {
  icon: typeof InstagramIcon;
  href: string;
  value: string;
  copyValue: string;
  external?: boolean;
}) {
  const t = useTranslations("applicants");
  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" />
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        className="min-w-0 truncate font-medium tabular-nums hover:underline"
      >
        {value}
      </a>
      <button
        type="button"
        aria-label={t("copy")}
        onClick={() => copy(copyValue, t("copied"), t("copyFailed"))}
        className={cn(
          "ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none",
          "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground",
          "focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]",
        )}
      >
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
      </button>
    </div>
  );
}

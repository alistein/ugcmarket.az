"use client";

import {
  Add01Icon,
  Archive02Icon,
  ArchiveRestoreIcon,
  ArrowDown01Icon,
  Cancel01Icon,
  Calendar03Icon,
  Location01Icon,
  Clock01Icon,
  Copy01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilEdit02Icon,
  PlayIcon,
  SentIcon,
  Share08Icon,
  UserMultiple02Icon,
  Megaphone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CITIES } from "@/schemas";
import { localToday } from "../form";
import {
  type CampaignStatusValue,
  type MyCampaign,
  useArchiveCampaign,
  useDuplicateCampaign,
  useMyCampaigns,
  useSetCampaignStatus,
} from "../hooks";
import { useShareListing } from "../share";

const STATUS_BADGE: Record<CampaignStatusValue, "secondary" | "sun" | "mint" | "sky" | "rose"> = {
  draft: "secondary",
  pending_review: "sun",
  published: "mint",
  paused: "sky",
  closed: "secondary",
  rejected: "rose",
};

/** Live and in-progress listings first, finished ones last; newest first inside each group. */
const ORDER: Record<CampaignStatusValue, number> = {
  published: 0,
  pending_review: 1,
  paused: 2,
  draft: 3,
  rejected: 4,
  closed: 5,
};

/** The brand's own listings on /brand: one row each, status, applicants and actions. */
export function MyListings() {
  const t = useTranslations("campaign.mine");
  const tc = useTranslations("common");
  const { data, isPending, isError } = useMyCampaigns();
  const [showArchived, setShowArchived] = useState(false);

  const sorted = [...(data ?? [])].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || b.created_at.localeCompare(a.created_at),
  );
  const list = sorted.filter((c) => !c.archived_at);
  // Archived: most recently archived first.
  const archived = sorted
    .filter((c) => c.archived_at)
    .sort((a, b) => (b.archived_at ?? "").localeCompare(a.archived_at ?? ""));

  return (
    <section aria-labelledby="listings-title" className="grid gap-4">
      <div className="flex items-center gap-3">
        <h2 id="listings-title" className="text-xl font-semibold tracking-[-0.02em]">
          {t("title")}
          {list.length > 0 && <span className="ml-2 text-muted-foreground tabular-nums">{list.length}</span>}
        </h2>
        {list.length > 0 && (
          // The header's "Post a listing" is hidden on phones; this is its place there.
          <Button
            size="sm"
            className="ml-auto sm:hidden"
            nativeButton={false}
            render={<Link href="/brand/campaigns/new" />}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            {t("new")}
          </Button>
        )}
      </div>

      {isPending ? (
        <LoadingState>
          <ListingsSkeleton />
        </LoadingState>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          {tc("loadFailed")}
        </p>
      ) : (
        <>
          {list.length === 0 ? (
            <EmptyListings />
          ) : (
            <ul className={GRID}>
              {list.map((c) => (
                <ListingTile key={c.id} campaign={c} />
              ))}
            </ul>
          )}
          {archived.length > 0 && (
            <div className="grid gap-4">
              <Button
                variant="ghost"
                className="justify-self-start text-muted-foreground"
                aria-expanded={showArchived}
                aria-controls="archived-listings"
                onClick={() => setShowArchived((v) => !v)}
              >
                <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} data-icon="inline-start" />
                {t("archived")}
                <span className="tabular-nums">{archived.length}</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                  className={cn("[transition:rotate_200ms_var(--ease-out)]", showArchived && "rotate-180")}
                />
              </Button>
              {showArchived && (
                <ul id="archived-listings" className={GRID}>
                  {archived.map((c) => (
                    <ListingTile key={c.id} campaign={c} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EmptyListings() {
  const t = useTranslations("brand.dashboard");
  return (
    <div className="flex flex-col items-center rounded-3xl bg-card px-6 py-14 text-center shadow-(--shadow-soft)">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} className="size-6" />
      </span>
      <p className="mt-4 text-lg font-semibold tracking-[-0.02em]">{t("emptyTitle")}</p>
      <p className="mt-1 max-w-sm text-pretty text-muted-foreground">{t("emptyBody")}</p>
      <Button size="lg" className="mt-6" nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
        {t("newListing")}
      </Button>
    </div>
  );
}

const known = <T extends string>(list: readonly T[], v: string | null): v is T =>
  !!v && (list as readonly string[]).includes(v);

/** One tile placeholder, piece for piece like ListingTile (badge, title, price, extra, formats, footer). */
function ListingTileSkeleton() {
  return (
    <div className="flex min-h-64 flex-col rounded-3xl bg-card p-5 shadow-(--shadow-soft) sm:aspect-square sm:min-h-0">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="size-6 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-11/12" />
      <Skeleton className="mt-2 h-5 w-2/3" />
      <div className="mt-auto grid gap-3 pt-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="-mt-1 h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-border/70 pt-3">
          <div className="grid gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Tile grid placeholder (wrap in LoadingState), shared with the brand home skeleton. */
export function ListingsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <ListingTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Square tiles: one column on phones, two on tablets, three on desktop. */
const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/**
 * One listing as a square tile: status on top, title, then the pay (the big figure, like the
 * creator-facing card), formats and the deadline / applicants at the bottom. The whole tile opens
 * the listing page; applicants and editing are in the "⋯" menu.
 */
function ListingTile({ campaign: c }: { campaign: MyCampaign }) {
  const t = useTranslations("campaign.mine");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const applicants = c.applications[0]?.count ?? 0;
  const expired =
    !!c.deadline && c.deadline < localToday() && (c.status === "published" || c.status === "paused");
  const paid = c.compensation_type === "money" && !!c.compensation_value;
  // Paid: "+ what's on top"; barter: what's offered. Unpaid offers nothing.
  const extra =
    c.compensation_type === "unpaid" || !c.compensation_details
      ? null
      : c.compensation_type === "money"
        ? `+ ${c.compensation_details}`
        : c.compensation_details;
  const deadline = c.deadline?.split("-").reverse().join(".");
  // The tile opens the listing page (the public link; the owner sees a preview until it's live).
  const href = `/campaigns/${c.slug ?? c.id}`;

  return (
    <li
      className={cn(
        "relative flex min-h-64 flex-col rounded-3xl bg-card p-5 shadow-(--shadow-soft) sm:aspect-square sm:min-h-0",
        "[transition:box-shadow_200ms_ease] has-[a:hover]:shadow-(--shadow-raised)",
      )}
    >
      <div className="flex items-center gap-2 pr-9">
        <Badge variant={STATUS_BADGE[c.status]}>
          {c.status === "pending_review" && <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />}
          {t(`status.${c.status}`)}
        </Badge>
        {expired && <span className="text-xs text-destructive">{t("expired")}</span>}
      </div>
      <div className="absolute top-4 right-4">
        <ListingMenu campaign={c} />
      </div>

      <Link
        href={href}
        className={cn(
          "mt-3 line-clamp-3 text-lg leading-snug font-semibold tracking-[-0.02em] break-words outline-none",
          "after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-4 focus-visible:after:ring-ring/25",
          !c.title && "text-muted-foreground",
        )}
      >
        {c.title ?? t("untitled")}
      </Link>

      <div className="mt-auto grid gap-3 pt-4">
        <p
          className={cn(
            "text-2xl font-semibold tracking-[-0.03em] tabular-nums",
            c.compensation_type === "unpaid" || (c.compensation_type === "money" && !paid)
              ? "text-muted-foreground"
              : null,
          )}
        >
          {paid ? (
            <>
              {new Intl.NumberFormat(locale === "en" ? "en" : "ru", { maximumFractionDigits: 2 }).format(
                c.compensation_value as number,
              )}
              <span className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">
                {c.currency}
              </span>
            </>
          ) : (
            tt(`compensation.${c.compensation_type}` as never)
          )}
        </p>
        {extra && <p className="-mt-2 line-clamp-1 text-sm text-muted-foreground">{extra}</p>}
        {c.deliverables.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {c.deliverables.map((d) => (
              <Badge key={d.format} variant="sky">
                {tt(`formats.${d.format}` as never)}
                {d.count > 1 && <span className="tabular-nums">× {d.count}</span>}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-end justify-between gap-3 border-t border-border/70 pt-3 text-sm text-muted-foreground">
          <div className="grid min-w-0 gap-1">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 shrink-0" />
              <span className="truncate">
                {known(CITIES, c.city) ? tt(`cities.${c.city}`) : t("anyCity")}
              </span>
            </span>
            {deadline && (
              <span className="flex items-center gap-1.5 tabular-nums">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 shrink-0" />
                {deadline}
              </span>
            )}
          </div>
          <Applicants count={applicants} people={c.recent_applicants} />
        </div>
      </div>
    </li>
  );
}

/** Overlapping avatars of the newest applicants (one initial each) and the total count. */
function Applicants({ count, people }: { count: number; people: MyCampaign["recent_applicants"] }) {
  const t = useTranslations("campaign.mine");
  const names = (people ?? []).flatMap((p) => (p.creator ? [p.creator] : []));
  return (
    <span className="flex shrink-0 items-center gap-2">
      {names.length > 0 && (
        <span className="flex -space-x-2" aria-hidden>
          {names.map((p, i) => (
            <NamedAvatar
              key={`${p.display_name}-${i}`}
              name={p.display_name}
              src={p.avatar_url}
              size="sm"
              single
              className="ring-2 ring-card"
            />
          ))}
        </span>
      )}
      <span className="tabular-nums">
        <span className={cn("font-semibold", count > 0 && "text-foreground")}>{count}</span>{" "}
        {t("applicants", { count })}
      </span>
    </span>
  );
}

/** "⋯" per tile. Only the actions that make sense for the current status. */
function ListingMenu({ campaign: c }: { campaign: MyCampaign }) {
  const t = useTranslations("campaign.mine");
  const te = useTranslations();
  const tl = useTranslations("listing");
  const router = useRouter();
  const setStatus = useSetCampaignStatus();
  const duplicate = useDuplicateCampaign();
  const archive = useArchiveCampaign();
  const [confirmClose, setConfirmClose] = useState(false);
  const share = useShareListing();

  const onError = (e: unknown) => {
    const key = e instanceof ApiClientError ? e.message : "errors.unknown";
    toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
  };
  const change = (status: "published" | "paused" | "closed") =>
    setStatus.mutate(
      { id: c.id, status },
      {
        onSuccess: (res) =>
          toast.success(
            t(
              status === "published"
                ? res.status === "published"
                  ? "toast.published"
                  : "toast.sentForReview"
                : `toast.${status}`,
            ),
          ),
        onError,
      },
    );

  const setArchived = (archived: boolean) =>
    archive.mutate(
      { id: c.id, archived },
      { onSuccess: () => toast.success(t(archived ? "toast.archived" : "toast.restored")), onError },
    );

  // An archived listing is put away: it can only be restored, duplicated or have its applicants seen.
  const isArchived = !!c.archived_at;
  const canEdit = c.status !== "closed" && !isArchived;
  const canSeeApplicants = c.status === "published" || c.status === "paused" || c.status === "closed";
  const canPublish = (c.status === "draft" || c.status === "rejected") && !isArchived;
  const canResume = c.status === "paused";
  const canPause = c.status === "published";
  const canClose = c.status === "published" || c.status === "paused";
  // Live listings are closed first, so nothing leaves the board without the brand saying so.
  const canArchive = (c.status === "draft" || c.status === "rejected" || c.status === "closed") && !isArchived;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("actions")}
          className="relative z-10 -mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none [transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97] aria-expanded:bg-muted"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-60 p-1.5">
          {canPublish && (
            <DropdownMenuItem disabled={setStatus.isPending} onClick={() => change("published")}>
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
              {t("publish")}
            </DropdownMenuItem>
          )}
          {canResume && (
            <DropdownMenuItem disabled={setStatus.isPending} onClick={() => change("published")}>
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
              {t("resume")}
            </DropdownMenuItem>
          )}
          {canPause && (
            <DropdownMenuItem disabled={setStatus.isPending} onClick={() => change("paused")}>
              <HugeiconsIcon icon={PauseIcon} strokeWidth={2} />
              {t("pause")}
            </DropdownMenuItem>
          )}
          {c.status === "published" && (
            <DropdownMenuItem onClick={() => share(c)}>
              <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
              {tl("share")}
            </DropdownMenuItem>
          )}
          {canSeeApplicants && (
            <DropdownMenuItem onClick={() => router.push(`/brand/campaigns/${c.id}/applicants`)}>
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} />
              {t("applicantsLink")}
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push(`/brand/campaigns/${c.id}/edit`)}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
              {t("edit")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={duplicate.isPending}
            onClick={() =>
              duplicate.mutate(c.id, { onSuccess: () => toast.success(t("toast.duplicated")), onError })
            }
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            {t("duplicate")}
          </DropdownMenuItem>
          {canArchive && (
            <DropdownMenuItem disabled={archive.isPending} onClick={() => setArchived(true)}>
              <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} />
              {t("archive")}
            </DropdownMenuItem>
          )}
          {isArchived && (
            <DropdownMenuItem disabled={archive.isPending} onClick={() => setArchived(false)}>
              <HugeiconsIcon icon={ArchiveRestoreIcon} strokeWidth={2} />
              {t("restore")}
            </DropdownMenuItem>
          )}
          {canClose && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmClose(true)}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                {t("close")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("closeTitle")}</DialogTitle>
            <DialogDescription>{t("closeBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmClose(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={setStatus.isPending}
              onClick={() => {
                change("closed");
                setConfirmClose(false);
              }}
            >
              {t("closeConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

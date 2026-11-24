"use client";

import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  InstagramIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/features/campaigns/components/listing-card";
import { useMe } from "@/features/me/hooks";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { type ApplyResult, useApply, useMyApplications } from "../hooks";

/**
 * The creator's action on a live listing: apply (with an optional note), then see the brand's
 * contacts. The deal itself happens off-platform. Shown to guests (log in), creators (apply or
 * the steps before it) and nobody else. On a bid listing (`bidCurrency` set) the creator also
 * names their price.
 */
export function ApplyBlock({ campaignId, bidCurrency }: { campaignId: string; bidCurrency?: string }) {
  const t = useTranslations("listing.apply");
  const locale = useLocale();
  const { data: me, isPending } = useMe();
  const isCreator = me?.role === "creator";
  const mine = useMyApplications(isCreator && !!me?.creator);
  const application = mine.data?.find((a) => a.campaign?.id === campaignId);
  const applied = !!application;
  const [contact, setContact] = useState<ApplyResult["contact"] | undefined>(undefined);

  if (isPending) return null;

  // Brands and admins don't apply.
  if (me && !isCreator) return null;

  if (!me)
    return (
      <Block>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={
            <Link href={{ pathname: "/login", query: { next: `/${locale}/campaigns/${campaignId}` } }} />
          }
        >
          {t("apply")}
        </Button>
        <Note>{t("loginNote")}</Note>
      </Block>
    );

  if (!me.creator)
    return (
      <Block>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/me/profile" />}
        >
          {t("createProfile")}
        </Button>
        <Note>{t("noProfileNote")}</Note>
      </Block>
    );

  if (me.creator.review_status !== "approved")
    return (
      <Block>
        <Button size="lg" className="w-full sm:w-auto" disabled>
          {t("apply")}
        </Button>
        <Note icon={Clock01Icon}>{t("pendingNote")}</Note>
      </Block>
    );

  if (contact !== undefined) return <Contacts contact={contact} />;

  return applied ? (
    <AlreadyApplied
      campaignId={campaignId}
      bid={
        bidCurrency && application?.bid_amount
          ? { amount: application.bid_amount, currency: bidCurrency }
          : null
      }
      onContact={setContact}
    />
  ) : (
    <ApplyAction campaignId={campaignId} bidCurrency={bidCurrency} onContact={setContact} />
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="grid justify-items-start gap-3">{children}</div>;
}

function Note({ children, icon }: { children: React.ReactNode; icon?: typeof Clock01Icon }) {
  return (
    <p className="flex items-start gap-2 text-sm text-pretty text-muted-foreground">
      {icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />}
      {children}
    </p>
  );
}

function useApplyAction(campaignId: string, onContact: (c: ApplyResult["contact"]) => void) {
  const te = useTranslations();
  const apply = useApply(campaignId);
  const run = (input: { message?: string; bid_amount?: number } = {}, success?: string) =>
    apply.mutate(
      { message: input.message?.trim() || undefined, bid_amount: input.bid_amount },
      {
        onSuccess: (res) => {
          if (success) toast.success(success);
          onContact(res.contact);
        },
        onError: (e) => {
          const key = e instanceof ApiClientError ? e.message : "errors.unknown";
          toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
        },
      },
    );
  return { run, pending: apply.isPending };
}

/** Apply with an optional short note to the brand (and a price on bid listings), in a dialog. */
function ApplyAction({
  campaignId,
  bidCurrency,
  onContact,
}: {
  campaignId: string;
  bidCurrency?: string;
  onContact: (c: ApplyResult["contact"]) => void;
}) {
  const t = useTranslations("listing.apply");
  const te = useTranslations();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [bid, setBid] = useState("");
  const [bidError, setBidError] = useState(false);
  const bidAmount = Number(bid.replace(",", "."));
  const send = () => {
    if (bidCurrency && !(Number.isFinite(bidAmount) && bidAmount > 0 && bidAmount <= 1_000_000)) {
      setBidError(true);
      return;
    }
    run({ message, bid_amount: bidCurrency ? bidAmount : undefined }, t("sent"));
  };
  const { run, pending } = useApplyAction(campaignId, (c) => {
    setOpen(false);
    onContact(c);
  });

  return (
    <Block>
      <Button size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        {t("apply")}
      </Button>
      <Note>{t("applyNote")}</Note>

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t(bidCurrency ? "dialogBodyBid" : "dialogBody")}</DialogDescription>
          </DialogHeader>
          {bidCurrency && (
            <div className="grid gap-2">
              <label htmlFor="apply-bid" className="text-sm font-medium">
                {t("bid")}
              </label>
              <div className="relative sm:max-w-56">
                <Input
                  id="apply-bid"
                  value={bid}
                  onChange={(e) => {
                    setBid(e.target.value);
                    setBidError(false);
                  }}
                  inputMode="decimal"
                  placeholder="150"
                  aria-invalid={bidError || undefined}
                  aria-describedby={bidError ? "apply-bid-error" : undefined}
                  className="pr-14 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
                  {bidCurrency}
                </span>
              </div>
              {bidError ? (
                <p id="apply-bid-error" className="text-sm text-destructive">
                  {te("validation.bidRequired")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("bidHint")}</p>
              )}
            </div>
          )}
          <div className="grid gap-2">
            <label htmlFor="apply-message" className="text-sm font-medium">
              {t("message")}
            </label>
            <Textarea
              id="apply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={t("messagePh")}
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">{message.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button disabled={pending} onClick={send}>
              {t("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Block>
  );
}

/** Already applied: say so (and the bid), and let them see the contacts again (apply is idempotent). */
function AlreadyApplied({
  campaignId,
  bid,
  onContact,
}: {
  campaignId: string;
  bid: { amount: number; currency: string } | null;
  onContact: (c: ApplyResult["contact"]) => void;
}) {
  const t = useTranslations("listing.apply");
  const locale = useLocale();
  const { run, pending } = useApplyAction(campaignId, onContact);
  return (
    <Block>
      <p className="flex items-center gap-2 font-medium">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5 text-mint-ink" />
        {t("applied")}
      </p>
      {bid && (
        <p className="text-sm text-muted-foreground tabular-nums">
          {t("yourBid", { amount: formatAmount(bid.amount, locale), currency: bid.currency })}
        </p>
      )}
      <Button variant="outline" disabled={pending} onClick={() => run()}>
        {t("showContacts")}
      </Button>
    </Block>
  );
}

/** The brand's contacts after applying: tap to open, or copy. */
function Contacts({ contact }: { contact: ApplyResult["contact"] }) {
  const t = useTranslations("listing.apply");
  const rows = [
    contact?.instagram && {
      icon: InstagramIcon,
      href: `https://www.instagram.com/${contact.instagram}/`,
      value: `@${contact.instagram}`,
      copy: contact.instagram,
      external: true,
    },
  ].filter(Boolean) as {
    icon: typeof InstagramIcon;
    href: string;
    value: string;
    copy: string;
    external?: boolean;
  }[];

  return (
    <div className="grid gap-3">
      <p className="flex items-center gap-2 font-medium">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5 text-mint-ink" />
        {t("applied")}
      </p>
      <p className="text-sm text-pretty text-muted-foreground">{t("contactsNote")}</p>
      {rows.length > 0 ? (
        <div className="grid gap-1 rounded-3xl bg-card p-3 shadow-(--shadow-soft)">
          {rows.map((r) => (
            <div key={r.value} className="flex items-center gap-2.5 px-2 py-1.5">
              <HugeiconsIcon
                icon={r.icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <a
                href={r.href}
                {...(r.external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                className="min-w-0 truncate font-medium tabular-nums hover:underline"
              >
                {r.value}
              </a>
              <button
                type="button"
                aria-label={t("copy")}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(r.copy);
                    toast.success(t("copied"));
                  } catch {
                    toast.error(t("copyFailed"));
                  }
                }}
                className={cn(
                  "ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none",
                  "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground",
                  "focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]",
                )}
              >
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noContacts")}</p>
      )}
    </div>
  );
}

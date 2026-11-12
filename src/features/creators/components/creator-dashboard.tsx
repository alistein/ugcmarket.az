"use client";

import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Megaphone01Icon,
  Share08Icon,
  Tick02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { completeness } from "../form";
import { type MyCreator, useMyCreator } from "../hooks";

export function CreatorDashboard() {
  const t = useTranslations("common");
  const { data, isPending, isError } = useMyCreator();
  if (isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <Dashboard creator={data} /> : <SetupPrompt />;
}

function SetupPrompt() {
  const t = useTranslations("creator.dashboard");
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-card p-7 text-center shadow-(--shadow-raised) ring-1 ring-foreground/[0.04] sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-mint text-mint-ink">
        <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-7" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance">{t("setupTitle")}</h1>
      <p className="mt-2 text-pretty text-muted-foreground">{t("setupBody")}</p>
      <Button size="lg" className="mt-6" nativeButton={false} render={<Link href="/me/profile" />}>
        {t("setupCta")}
        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
      </Button>
    </div>
  );
}

function Dashboard({ creator }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const { items, percent } = completeness(creator);
  return (
    <div className="grid gap-4 *:min-w-0">
      <div className="flex items-center gap-4">
        <NamedAvatar
          name={creator.display_name}
          src={creator.avatar_url}
          className="size-14"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {t("hello", { name: creator.display_name.split(" ")[0] })}
          </h1>
          <p className="truncate text-sm text-muted-foreground">@{creator.handle}</p>
        </div>
      </div>

      <StatusCard status={creator.review_status} />

      <div className="grid gap-4 *:min-w-0 md:grid-cols-2">
        <ShareCard creator={creator} />
        <section className="min-w-0 rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold tracking-[-0.02em]">{t("completeTitle")}</h2>
            <span className="text-sm font-medium text-primary tabular-nums">{percent}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-4 grid gap-1">
            {items.map((i) => (
              <li key={i.key}>
                <Link
                  href={`/me/profile#${i.section}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      i.done ? "bg-mint text-mint-ink" : "ring-1 ring-border",
                    )}
                  >
                    {i.done && <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3" />}
                  </span>
                  <span
                    className={cn(i.done && "text-muted-foreground line-through decoration-foreground/20")}
                  >
                    {t(`checklist.${i.key}`)}
                  </span>
                  {!i.done && (
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="ml-auto size-4 text-muted-foreground"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link
        href="/campaigns"
        className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] transition-colors hover:bg-muted/50 sm:p-6"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sun text-sun-ink">
          <HugeiconsIcon icon={Megaphone01Icon} strokeWidth={2} className="size-5" />
        </span>
        <span className="grid gap-0.5">
          <span className="font-semibold tracking-[-0.02em]">{t("boardTitle")}</span>
          <span className="text-sm text-muted-foreground">{t("boardBody")}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="ml-auto size-5 shrink-0 text-muted-foreground"
        />
      </Link>
    </div>
  );
}

function StatusCard({ status }: { status: MyCreator["review_status"] }) {
  const t = useTranslations("creator.dashboard.status");
  const style = {
    pending: { tint: "bg-sun text-sun-ink", icon: Clock01Icon },
    approved: { tint: "bg-mint text-mint-ink", icon: CheckmarkCircle02Icon },
    rejected: { tint: "bg-rose text-rose-ink", icon: Alert02Icon },
  }[status];
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-3xl p-5", style.tint)}>
      <HugeiconsIcon icon={style.icon} strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
      <div className="grid gap-0.5">
        <p className="font-semibold">{t(`${status}.title`)}</p>
        <p className="text-sm opacity-80">{t(`${status}.body`)}</p>
      </div>
      {status === "rejected" && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto shrink-0"
          nativeButton={false}
          render={<Link href="/me/profile" />}
        >
          {t("rejected.cta")}
        </Button>
      )}
    </div>
  );
}

function ShareCard({ creator }: { creator: MyCreator }) {
  const t = useTranslations("creator.dashboard");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === "undefined" ? "" : `${window.location.origin}/${locale}/creator/${creator.handle}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ title: creator.display_name, url }).catch(() => {});
    else await copy();
  };

  return (
    <section className="flex min-w-0 flex-col rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-6">
      <h2 className="font-semibold tracking-[-0.02em]">{t("shareTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {creator.review_status === "approved" ? t("shareBody") : t("sharePending")}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted py-1.5 pr-1.5 pl-3.5">
        <span className="min-w-0 flex-1 truncate text-sm tabular-nums" title={url}>
          {url.replace(/^https?:\/\//, "")}
        </span>
        <Button size="sm" variant="outline" onClick={copy} aria-live="polite">
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="soft" onClick={share}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
          {t("share")}
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href={`/creator/${creator.handle}`} />}>
          {t("preview")}
        </Button>
      </div>
    </section>
  );
}

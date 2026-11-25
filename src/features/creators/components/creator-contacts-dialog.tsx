"use client";

import { Copy01Icon, InstagramIcon, Mail01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useMe } from "@/features/me/hooks";
import { useCreatorContacts } from "../hooks";

/**
 * A brand's direct line to a creator: phone, email and Instagram, each one tap to open and one
 * to copy. Loaded only when the popup opens; the server checks the viewer is a brand.
 */
export function CreatorContactsDialog({
  handle,
  name,
  open,
  onOpenChange,
}: {
  handle: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("creator.contacts");
  const te = useTranslations();
  const { data: me } = useMe();
  const q = useCreatorContacts(handle, me?.id, open);

  const rows = q.data
    ? ([
        q.data.phone && {
          icon: SmartPhone01Icon,
          label: t("phone"),
          value: q.data.phone,
          href: `tel:${q.data.phone.replace(/[^\d+]/g, "")}`,
        },
        q.data.email && {
          icon: Mail01Icon,
          label: t("email"),
          value: q.data.email,
          href: `mailto:${q.data.email}`,
        },
        q.data.instagram && {
          icon: InstagramIcon,
          label: "Instagram",
          value: `https://www.instagram.com/${q.data.instagram}/`,
          display: `@${q.data.instagram}`,
          href: `https://www.instagram.com/${q.data.instagram}/`,
          external: true,
        },
      ].filter(Boolean) as {
        icon: typeof InstagramIcon;
        label: string;
        value: string;
        display?: string;
        href: string;
        external?: boolean;
      }[])
    : [];

  const errorCode = q.error instanceof ApiClientError ? q.error.code : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>

        {q.isPending && (
          <div className="grid gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        )}

        {errorCode === "brand_profile_required" ? (
          <div className="grid justify-items-start gap-3">
            <p className="text-sm text-pretty text-muted-foreground">{te("errors.brand_profile_required")}</p>
            <Button nativeButton={false} render={<Link href="/brand/profile" />}>
              {t("createBrand")}
            </Button>
          </div>
        ) : q.isError ? (
          <p className="text-sm text-destructive">
            {te.has(q.error.message as never) ? te(q.error.message as never) : te("errors.unknown")}
          </p>
        ) : null}

        {q.data &&
          (rows.length ? (
            <ul className="grid gap-2">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 pl-4">
                  <HugeiconsIcon
                    icon={r.icon}
                    strokeWidth={2}
                    className="size-5 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">{r.label}</span>
                    <a
                      href={r.href}
                      {...(r.external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                      className="block truncate font-medium tabular-nums hover:underline"
                    >
                      {r.display ?? r.value}
                    </a>
                  </span>
                  <CopyButton value={r.value} label={t("copy")} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ))}
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("creator.contacts");
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(t("copied"));
        } catch {
          toast.error(t("copyFailed"));
        }
      }}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none",
        "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-card hover:text-foreground",
        "focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]",
      )}
    >
      <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
    </button>
  );
}

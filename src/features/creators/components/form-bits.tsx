"use client";

import { Camera01Icon, Loading03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { NamedAvatar } from "@/components/shared/named-avatar";
import { cn } from "@/lib/utils";
import { useUploadAvatar } from "../hooks";

/** Multi-select as tappable chips (categories, languages). */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  max,
  invalid,
  describedBy,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  label: (v: T) => string;
  max?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const full = max !== undefined && value.length >= max;
  return (
    <div
      role="group"
      aria-describedby={describedBy}
      data-invalid={invalid || undefined}
      className="flex flex-wrap gap-2 rounded-2xl data-invalid:ring-2 data-invalid:ring-destructive/30 data-invalid:ring-offset-4 data-invalid:ring-offset-card"
    >
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={!on && full}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm select-none",
              "[transition:scale_160ms_var(--ease-out),background-color_150ms_ease,color_150ms_ease] active:scale-[0.97]",
              "outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:opacity-40",
              on
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
            )}
          >
            {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />}
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Round photo picker → resized WebP upload → public URL. */
export function AvatarField({
  value,
  name,
  onChange,
}: {
  value: string | null;
  name: string;
  onChange: (url: string | null) => void;
}) {
  const t = useTranslations("creator.form");
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast.error(t("avatarTooBig"));
    upload.mutate(file, {
      onSuccess: (url) => onChange(url),
      onError: () => toast.error(t("avatarFailed")),
    });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={upload.isPending}
        aria-label={t("avatarPick")}
        className="group relative size-20 shrink-0 rounded-full outline-none [transition:scale_160ms_var(--ease-out)] focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
      >
        <NamedAvatar name={name || "?"} src={value} className="size-20" fallbackClassName="text-xl" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-(--shadow-raised)">
          <HugeiconsIcon
            icon={upload.isPending ? Loading03Icon : Camera01Icon}
            strokeWidth={2}
            className={cn("size-4", upload.isPending && "animate-spin")}
          />
        </span>
      </button>
      <div className="grid gap-1 text-sm">
        <span className="font-medium">{t("avatar")}</span>
        <span className="text-muted-foreground">{t("avatarHint")}</span>
        {value && (
          <button
            type="button"
            className="w-fit text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => onChange(null)}
          >
            {t("avatarRemove")}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Section wrapper used by the edit form and the wizard steps. */
export function FormSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-7 dark:ring-white/[0.07]"
    >
      <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

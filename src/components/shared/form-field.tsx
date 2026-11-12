"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";

type FieldProps = {
  label: React.ReactNode;
  error?: Pick<FieldError, "message">;
  hint?: string;
  aside?: React.ReactNode;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label + control + hint/error, wired with aria-describedby. Error messages are i18n keys. */
export function Field({ label, error, hint, aside, children }: FieldProps) {
  const t = useTranslations();
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error?.message;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      {children({
        id,
        "aria-invalid": !!error || undefined,
        "aria-describedby": message || hint ? msgId : undefined,
      })}
      {message ? (
        <p id={msgId} className="text-xs text-destructive">
          {/* zod messages are keys like "validation.email" */}
          {t.has(message as never) ? t(message as never) : t("validation.required")}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

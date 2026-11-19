"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";

type FieldProps = {
  label: React.ReactNode;
  error?: Pick<FieldError, "message">;
  hint?: string;
  /** Marks the label with a red asterisk and the control as aria-required. */
  required?: boolean;
  aside?: React.ReactNode;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    "aria-required"?: boolean;
  }) => React.ReactNode;
};

/** Label + control + hint/error, wired with aria-describedby. Error messages are i18n keys. */
export function Field({ label, error, hint, required, aside, className, children }: FieldProps) {
  const t = useTranslations();
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error?.message;
  return (
    <div className={className ? `grid content-start gap-2 ${className}` : "grid content-start gap-2"}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden className="-ml-1 text-destructive">
              *
            </span>
          )}
        </Label>
        {aside}
      </div>
      {children({
        id,
        "aria-invalid": !!error || undefined,
        "aria-describedby": message || hint ? msgId : undefined,
        "aria-required": required || undefined,
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

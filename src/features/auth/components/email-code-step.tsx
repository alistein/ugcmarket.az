"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CodeInput as CodeSchema, type CodeInput as CodeValues } from "@/schemas/auth";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import { type CodeType, useResendCode, useVerifyEmailCode } from "../hooks";
import { CodeInput, Field, FormError, SubmitButton, useCooldown } from "./auth-ui";

type Props = {
  email: string;
  type: Exclude<CodeType, "recovery">;
  next: string;
  onVerified: () => void | Promise<void>;
  onChangeEmail?: () => void;
  /** Hide the "we sent a code to …" line when the card subtitle already says it. */
  hideSentTo?: boolean;
};

/** "We sent a code to …" → 6-digit input (auto-submits) → resend with cooldown. */
export function EmailCodeStep({ email, type, next, onVerified, onChangeEmail, hideSentTo }: Props) {
  const t = useTranslations("auth");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const verify = useVerifyEmailCode(type);
  const resend = useResendCode(type, next);
  const cooldown = useCooldown();
  const form = useForm<CodeValues>({ resolver: zodResolver(CodeSchema), defaultValues: { code: "" } });

  const submit = form.handleSubmit(({ code }) => {
    if (verify.isPending) return;
    setError(null);
    verify.mutate(
      { email, code: String(code) },
      {
        onSuccess: () => onVerified(),
        onError: (e) => {
          setError(errorKeyOf(e));
          form.setValue("code", "");
          form.setFocus("code");
        },
      },
    );
  });

  const onResend = () => {
    setError(null);
    resend.mutate(email, {
      onSuccess: () => {
        cooldown.restart();
        toast.success(t("code.resent"));
      },
      onError: (e) => setError(errorKeyOf(e)),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {!hideSentTo && <p className="text-sm text-muted-foreground">{t("code.sentTo", { email })}</p>}
      <Field label={t("fields.code")} error={form.formState.errors.code} hint={t("code.spamHint")}>
        {(a) => (
          <CodeInput
            {...a}
            {...form.register("code")}
            autoFocus
            disabled={verify.isPending}
            onComplete={() => void submit()}
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={verify.isPending || verify.isSuccess}>{t("code.verify")}</SubmitButton>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0"
          disabled={cooldown.left > 0 || resend.isPending}
          onClick={onResend}
        >
          {cooldown.left > 0 ? t("code.resendIn", { seconds: cooldown.left }) : t("code.resend")}
        </Button>
        {onChangeEmail && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0 text-muted-foreground"
            onClick={onChangeEmail}
          >
            {t("code.changeEmail")}
          </Button>
        )}
      </div>
    </form>
  );
}

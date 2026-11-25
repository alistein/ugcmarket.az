"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
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

  // One request per code. A second submit while the first is running (autofill firing twice, an
  // extra digit, Enter right after the sixth digit) would reuse a code Supabase has just consumed
  // and show "wrong code" although the sign-in went through. A ref, not `verify.isPending`: that
  // value is from the last render and still false when two submits arrive in the same tick.
  const busy = useRef(false);
  const submit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    if (busy.current) return;
    busy.current = true;
    let verified = false;
    try {
      await form.handleSubmit(async ({ code }) => {
        setError(null);
        try {
          await verify.mutateAsync({ email, code: String(code) });
          verified = true;
          await onVerified();
        } catch (err) {
          setError(errorKeyOf(err));
          form.setValue("code", "");
          form.setFocus("code");
        }
      })(e);
    } finally {
      // Stay locked after success: the page is navigating away.
      if (!verified) busy.current = false;
    }
  };

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

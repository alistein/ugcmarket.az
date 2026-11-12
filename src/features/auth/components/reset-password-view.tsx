"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  EmailInput,
  type EmailInput as EmailValues,
  NewPassword,
  OtpCode,
  SetPasswordInput,
} from "@/schemas/auth";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import {
  useAfterAuth,
  useNextPath,
  useResendCode,
  useSendPasswordReset,
  useUpdatePassword,
  useVerifyEmailCode,
} from "../hooks";
import { AuthCard, CodeInput, Field, FormError, PasswordInput, SubmitButton, useCooldown } from "./auth-ui";

/**
 * 1. request: email → recovery code
 * 2. code: code + new password → verifyOtp(recovery) signs in → updateUser({ password })
 * update (?step=update, from the email link via /api/auth/confirm): session exists → new password only
 */
export function ResetPasswordView() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const next = useNextPath(null);
  const afterAuth = useAfterAuth(next);
  const [email, setEmail] = useState<string | null>(null);
  const [linkSession, setLinkSession] = useState(params.get("step") === "update");
  const [notice, setNotice] = useState<AuthErrorKey | null>(null);

  const done = async () => {
    toast.success(t("reset.done"));
    await afterAuth();
  };
  const footer = (
    <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
      {t("reset.backToLogin")}
    </Link>
  );

  if (linkSession) {
    return (
      <AuthCard title={t("reset.updateTitle")} subtitle={t("reset.updateSubtitle")} footer={footer}>
        <NewPasswordForm
          onDone={done}
          onSessionMissing={() => {
            setNotice("session_missing");
            setLinkSession(false);
          }}
        />
      </AuthCard>
    );
  }
  if (email) {
    return (
      <AuthCard title={t("reset.codeTitle")} subtitle={t("reset.codeSubtitle", { email })} footer={footer}>
        <CodeAndPasswordForm email={email} onDone={done} onChangeEmail={() => setEmail(null)} />
      </AuthCard>
    );
  }
  return (
    <AuthCard title={t("reset.title")} subtitle={t("reset.subtitle")} footer={footer}>
      <RequestForm onSent={setEmail} initialError={notice} />
    </AuthCard>
  );
}

function RequestForm({
  onSent,
  initialError,
}: {
  onSent: (email: string) => void;
  initialError: AuthErrorKey | null;
}) {
  const t = useTranslations("auth");
  const [error, setError] = useState<AuthErrorKey | null>(initialError);
  const send = useSendPasswordReset();
  const form = useForm<EmailValues>({ resolver: zodResolver(EmailInput), defaultValues: { email: "" } });
  // Same response whether or not the email has an account (Supabase doesn't reveal it either).
  const submit = form.handleSubmit(({ email }) => {
    setError(null);
    send.mutate(email, { onSuccess: () => onSent(email), onError: (e) => setError(errorKeyOf(e)) });
  });
  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label={t("fields.email")} error={form.formState.errors.email}>
        {(a) => (
          <Input
            {...a}
            {...form.register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="send"
            autoFocus
            placeholder={t("fields.emailPlaceholder")}
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={send.isPending}>{t("reset.send")}</SubmitButton>
    </form>
  );
}

const CodeAndPassword = z
  .object({ code: OtpCode, password: NewPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "validation.passwordMismatch" });

function CodeAndPasswordForm({
  email,
  onDone,
  onChangeEmail,
}: {
  email: string;
  onDone: () => void;
  onChangeEmail: () => void;
}) {
  const t = useTranslations("auth");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const verify = useVerifyEmailCode("recovery");
  const update = useUpdatePassword();
  const resend = useResendCode("recovery", "");
  const cooldown = useCooldown();
  const form = useForm({
    resolver: zodResolver(CodeAndPassword),
    defaultValues: { code: "", password: "", confirm: "" },
  });
  const { errors } = form.formState;
  const pending = verify.isPending || update.isPending;

  const submit = form.handleSubmit(async ({ code, password }) => {
    setError(null);
    try {
      // A verified code signs the user in with a recovery session; keep it if the password step fails.
      if (!verify.isSuccess) await verify.mutateAsync({ email, code });
      await update.mutateAsync(password);
      onDone();
    } catch (e) {
      const key = errorKeyOf(e);
      setError(key);
      if (key === "code_invalid") form.setValue("code", "");
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {!verify.isSuccess && (
        <Field label={t("fields.code")} error={errors.code} hint={t("code.spamHint")}>
          {(a) => <CodeInput {...a} {...form.register("code")} autoFocus />}
        </Field>
      )}
      <Field label={t("fields.newPassword")} error={errors.password} hint={t("signup.passwordHint")}>
        {(a) => <PasswordInput {...a} {...form.register("password")} autoComplete="new-password" />}
      </Field>
      <Field label={t("fields.confirmPassword")} error={errors.confirm}>
        {(a) => (
          <PasswordInput
            {...a}
            {...form.register("confirm")}
            autoComplete="new-password"
            enterKeyHint="done"
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={pending}>{t("reset.submit")}</SubmitButton>
      {!verify.isSuccess && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0"
            disabled={cooldown.left > 0 || resend.isPending}
            onClick={() =>
              resend.mutate(email, {
                onSuccess: () => {
                  cooldown.restart();
                  toast.success(t("code.resent"));
                },
                onError: (e) => setError(errorKeyOf(e)),
              })
            }
          >
            {cooldown.left > 0 ? t("code.resendIn", { seconds: cooldown.left }) : t("code.resend")}
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0 text-muted-foreground"
            onClick={onChangeEmail}
          >
            {t("code.changeEmail")}
          </Button>
        </div>
      )}
    </form>
  );
}

function NewPasswordForm({ onDone, onSessionMissing }: { onDone: () => void; onSessionMissing: () => void }) {
  const t = useTranslations("auth");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const update = useUpdatePassword();
  const form = useForm({
    resolver: zodResolver(SetPasswordInput),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit(({ password }) => {
    setError(null);
    update.mutate(password, {
      onSuccess: onDone,
      onError: (e) => {
        const key = errorKeyOf(e);
        if (key === "session_missing")
          onSessionMissing(); // link session gone → request a code instead
        else setError(key);
      },
    });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label={t("fields.newPassword")} error={errors.password} hint={t("signup.passwordHint")}>
        {(a) => <PasswordInput {...a} {...form.register("password")} autoComplete="new-password" autoFocus />}
      </Field>
      <Field label={t("fields.confirmPassword")} error={errors.confirm}>
        {(a) => (
          <PasswordInput
            {...a}
            {...form.register("confirm")}
            autoComplete="new-password"
            enterKeyHint="done"
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={update.isPending || update.isSuccess}>{t("reset.submit")}</SubmitButton>
    </form>
  );
}

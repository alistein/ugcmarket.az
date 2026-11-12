"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import { env } from "@/lib/env";
import { EmailInput, type EmailInput as EmailValues, LoginPasswordInput } from "@/schemas/auth";
import { type AuthErrorKey, errorKeyOf, isAuthErrorKey } from "../errors";
import { useAfterAuth, useNextPath, useSendEmailCode, useSignInWithPassword } from "../hooks";
import { AuthCard, Field, FormError, GoogleButton, OrDivider, PasswordInput, SubmitButton } from "./auth-ui";
import { EmailCodeStep } from "./email-code-step";

export function LoginView() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const next = useNextPath(params.get("next"));
  const urlError = params.get("error");
  const [error, setError] = useState<AuthErrorKey | null>(isAuthErrorKey(urlError) ? urlError : null);
  const [codeEmail, setCodeEmail] = useState<string | null>(null);
  const afterAuth = useAfterAuth(next);

  const query = { ...(params.get("next") && { next: params.get("next")! }) };

  if (codeEmail) {
    return (
      <AuthCard title={t("code.title")}>
        <EmailCodeStep
          email={codeEmail}
          type="email"
          next={next}
          onVerified={afterAuth}
          onChangeEmail={() => setCodeEmail(null)}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link
            href={{ pathname: "/signup", query }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("login.signupLink")}
          </Link>
        </>
      }
    >
      <GoogleButton next={next} onError={setError} />
      <OrDivider />
      {!env.authEmail ? (
        <PasswordForm next={next} onError={setError} error={error} onSuccess={afterAuth} />
      ) : (
        <Tabs defaultValue="password" onValueChange={() => setError(null)}>
          <TabsList className="w-full">
            <TabsTrigger value="password">{t("login.tabPassword")}</TabsTrigger>
            <TabsTrigger value="code">{t("login.tabCode")}</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="pt-4">
            <PasswordForm next={next} onError={setError} error={error} onSuccess={afterAuth} />
          </TabsContent>
          <TabsContent value="code" className="pt-4">
            <SendCodeForm
              next={next}
              onSent={setCodeEmail}
              onError={setError}
              error={error}
              hint={t("login.codeHint")}
            />
          </TabsContent>
        </Tabs>
      )}
    </AuthCard>
  );
}

function PasswordForm({
  next,
  error,
  onError,
  onSuccess,
}: {
  next: string;
  error: AuthErrorKey | null;
  onError: (k: AuthErrorKey | null) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const signIn = useSignInWithPassword();
  const form = useForm({
    resolver: zodResolver(LoginPasswordInput),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((v) => {
    onError(null);
    signIn.mutate(v, {
      onSuccess,
      onError: (e) => {
        const key = errorKeyOf(e);
        if (key === "email_not_confirmed" && env.authEmail) {
          router.push({ pathname: "/verify-email", query: { email: v.email, next } });
          return;
        }
        onError(key === "email_not_confirmed" ? "email_off" : key);
        if (key === "invalid_credentials") form.resetField("password");
      },
    });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label={t("fields.email")} error={errors.email}>
        {(a) => (
          <Input
            {...a}
            {...form.register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder={t("fields.emailPlaceholder")}
          />
        )}
      </Field>
      <Field
        label={t("fields.password")}
        error={errors.password}
        aside={
          env.authEmail && (
            <Link
              href="/reset-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("login.forgot")}
            </Link>
          )
        }
      >
        {(a) => (
          <PasswordInput
            {...a}
            {...form.register("password")}
            autoComplete="current-password"
            enterKeyHint="go"
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={signIn.isPending || signIn.isSuccess}>{t("login.submit")}</SubmitButton>
    </form>
  );
}

/** Email → send code. Shared by login ("Kodla") and signup ("şifrəsiz"). */
export function SendCodeForm({
  next,
  error,
  hint,
  onError,
  onSent,
}: {
  next: string;
  error: AuthErrorKey | null;
  hint?: string;
  onError: (k: AuthErrorKey | null) => void;
  onSent: (email: string) => void;
}) {
  const t = useTranslations("auth");
  const send = useSendEmailCode(next);
  const form = useForm<EmailValues>({ resolver: zodResolver(EmailInput), defaultValues: { email: "" } });

  const submit = form.handleSubmit(({ email }) => {
    onError(null);
    send.mutate(email, { onSuccess: () => onSent(email), onError: (e) => onError(errorKeyOf(e)) });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <Field label={t("fields.email")} error={form.formState.errors.email} hint={hint}>
        {(a) => (
          <Input
            {...a}
            {...form.register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="send"
            placeholder={t("fields.emailPlaceholder")}
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={send.isPending}>{t("code.send")}</SubmitButton>
    </form>
  );
}

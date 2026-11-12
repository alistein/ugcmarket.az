"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { env } from "@/lib/env";
import { OnboardingRole, SignupInput } from "@/schemas/auth";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import { useAfterAuth, useNextPath, useSignUp } from "../hooks";
import { AuthCard, Field, FormError, GoogleButton, OrDivider, PasswordInput, SubmitButton } from "./auth-ui";
import { EmailCodeStep } from "./email-code-step";
import { SendCodeForm } from "./login-view";

export function SignupView() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const params = useSearchParams();
  // Landing CTAs pass ?role=brand|creator; carry it to onboarding to pre-select.
  const role = OnboardingRole.safeParse(params.get("role")).data;
  const next = useNextPath(params.get("next") ?? (role ? `/${locale}/onboarding?role=${role}` : null));
  const afterAuth = useAfterAuth(next);
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeEmail, setCodeEmail] = useState<string | null>(null);

  const query = { ...(params.get("next") && { next: params.get("next")! }) };
  const title =
    role === "brand"
      ? t("signup.titleBrand")
      : role === "creator"
        ? t("signup.titleCreator")
        : t("signup.title");

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
      title={title}
      subtitle={t("signup.subtitle")}
      footer={
        <>
          {t("signup.haveAccount")}{" "}
          <Link
            href={{ pathname: "/login", query }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("signup.loginLink")}
          </Link>
        </>
      }
    >
      <GoogleButton next={next} onError={setError} />
      <OrDivider />
      {mode === "password" ? (
        <PasswordSignupForm next={next} error={error} onError={setError} onSignedIn={afterAuth} />
      ) : (
        <SendCodeForm next={next} error={error} onError={setError} onSent={setCodeEmail} />
      )}
      {env.authEmail && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            setError(null);
            setMode((m) => (m === "password" ? "code" : "password"));
          }}
        >
          {mode === "password" ? t("signup.withCode") : t("signup.withPassword")}
        </Button>
      )}
    </AuthCard>
  );
}

function PasswordSignupForm({
  next,
  error,
  onError,
  onSignedIn,
}: {
  next: string;
  error: AuthErrorKey | null;
  onError: (k: AuthErrorKey | null) => void;
  onSignedIn: () => void;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const signUp = useSignUp(next);
  const form = useForm({ resolver: zodResolver(SignupInput), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;

  const submit = form.handleSubmit((v) => {
    onError(null);
    signUp.mutate(v, {
      onSuccess: ({ data }) => {
        // Confirmations off (local dev) → already signed in. Otherwise confirm with the emailed code.
        // Existing emails get the same response on purpose (no account enumeration).
        if (data.session) onSignedIn();
        // Emails off but Supabase still requires confirmation → nothing will arrive; say so.
        else if (!env.authEmail) onError("email_off");
        else router.push({ pathname: "/verify-email", query: { email: v.email, next } });
      },
      onError: (e) => onError(errorKeyOf(e)),
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
      <Field label={t("fields.password")} error={errors.password} hint={t("signup.passwordHint")}>
        {(a) => (
          <PasswordInput
            {...a}
            {...form.register("password")}
            autoComplete="new-password"
            enterKeyHint="go"
          />
        )}
      </Field>
      <FormError error={error} />
      <SubmitButton pending={signUp.isPending}>{t("signup.submit")}</SubmitButton>
    </form>
  );
}

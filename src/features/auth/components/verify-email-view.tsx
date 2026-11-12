"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { Email, EmailInput, type EmailInput as EmailValues } from "@/schemas/auth";
import { useAfterAuth, useNextPath } from "../hooks";
import { AuthCard, Field, SubmitButton } from "./auth-ui";
import { EmailCodeStep } from "./email-code-step";

/** After a password sign-up (or an unconfirmed login): type the 6-digit confirmation code. */
export function VerifyEmailView() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const next = useNextPath(params.get("next"));
  const afterAuth = useAfterAuth(next);
  const [email, setEmail] = useState<string | null>(Email.safeParse(params.get("email")).data ?? null);

  const footer = (
    <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
      {t("reset.backToLogin")}
    </Link>
  );

  if (!email) {
    return (
      <AuthCard title={t("verify.title")} subtitle={t("verify.missingEmail")} footer={footer}>
        <EmailForm onSubmit={setEmail} />
      </AuthCard>
    );
  }
  return (
    <AuthCard title={t("verify.title")} subtitle={t("verify.subtitle", { email })} footer={footer}>
      <EmailCodeStep
        email={email}
        type="signup"
        next={next}
        onVerified={afterAuth}
        onChangeEmail={() => setEmail(null)}
        hideSentTo
      />
    </AuthCard>
  );
}

function EmailForm({ onSubmit }: { onSubmit: (email: string) => void }) {
  const t = useTranslations("auth");
  const form = useForm<EmailValues>({ resolver: zodResolver(EmailInput), defaultValues: { email: "" } });
  return (
    <form onSubmit={form.handleSubmit(({ email }) => onSubmit(email))} noValidate className="grid gap-4">
      <Field label={t("fields.email")} error={form.formState.errors.email}>
        {(a) => (
          <Input
            {...a}
            {...form.register("email")}
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoFocus
          />
        )}
      </Field>
      <SubmitButton>{t("verify.continue")}</SubmitButton>
    </form>
  );
}

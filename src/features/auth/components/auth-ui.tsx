"use client";

import { GoogleIcon, Loading03Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import { useSignInWithGoogle } from "../hooks";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="rounded-3xl bg-card p-6 shadow-(--shadow-raised) ring-1 ring-foreground/[0.04] sm:p-8 dark:ring-white/[0.07]">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

/** Translated, announced error banner. Only ever shows our own i18n keys, never raw server text. */
export function FormError({ error }: { error: AuthErrorKey | null | undefined }) {
  const t = useTranslations("auth.errors");
  if (!error) return null;
  return (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      {t(error)}
    </p>
  );
}

type FieldProps = {
  label: string;
  error?: FieldError;
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

export function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const t = useTranslations("auth.fields");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-11", props.className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        <HugeiconsIcon icon={visible ? ViewOffIcon : ViewIcon} strokeWidth={2} />
      </Button>
    </div>
  );
}

/** One field for the 6-digit code: OS autofill (one-time-code), numeric keypad, paste-friendly. */
export function CodeInput({
  onComplete,
  ...props
}: React.ComponentProps<typeof Input> & { onComplete?: (code: string) => void }) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="none"
      autoCorrect="off"
      enterKeyHint="done"
      placeholder="••••••"
      className={cn(
        "h-14 rounded-2xl text-center font-mono text-2xl tracking-[0.4em] tabular-nums placeholder:text-muted-foreground/40",
        props.className,
      )}
      onChange={(e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
        props.onChange?.(e);
        if (e.target.value.length === 6) onComplete?.(e.target.value);
      }}
    />
  );
}

export function SubmitButton({
  pending,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending || props.disabled}
      aria-busy={pending}
      {...props}
    >
      {pending && (
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="animate-spin"
          data-icon="inline-start"
        />
      )}
      {children}
    </Button>
  );
}

export function OrDivider() {
  const t = useTranslations("auth");
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      {t("or")}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleButton({ next, onError }: { next: string; onError: (key: AuthErrorKey) => void }) {
  const t = useTranslations("auth");
  const google = useSignInWithGoogle(next);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={google.isPending}
      onClick={() => google.mutate(undefined, { onError: (e) => onError(errorKeyOf(e)) })}
    >
      {google.isPending ? (
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="animate-spin"
          data-icon="inline-start"
        />
      ) : (
        <GoogleMark />
      )}
      {t("google")}
    </Button>
  );
}

/**
 * Google's official "G" mark (public/brands/google-g.svg, from Google's sign-in branding
 * guidelines). Falls back to the Hugeicons outline until the file is added.
 */
function GoogleMark() {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // onError can fire before hydration; catch an already-failed load too.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  if (missing) return <HugeiconsIcon icon={GoogleIcon} strokeWidth={2} data-icon="inline-start" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimisation needed
    <img
      ref={ref}
      src="/brands/google-g.svg"
      alt=""
      aria-hidden
      width={18}
      height={18}
      data-icon="inline-start"
      className="size-[18px]"
      onError={() => setMissing(true)}
    />
  );
}

/** Countdown before "resend" is allowed again (Supabase also enforces 60s server-side). */
export function useCooldown(seconds = 60) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}

/** Shown on email-only screens (verify, reset) while auth emails are off (env.authEmail). */
export function EmailOffCard() {
  const t = useTranslations("auth");
  return (
    <AuthCard
      title={t("emailOff.title")}
      subtitle={t("emailOff.body")}
      footer={
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("reset.backToLogin")}
        </Link>
      }
    >
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href="/login" />}
      >
        {t("login.submit")}
      </Button>
    </AuthCard>
  );
}

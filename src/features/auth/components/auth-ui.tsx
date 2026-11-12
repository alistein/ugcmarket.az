"use client";

import {
  ArrowLeft01Icon,
  GoogleIcon,
  Loading03Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import { useSignInWithGoogle } from "../hooks";

/**
 * Auth screens use an outlined, calmer field style (Base44-like) on top of the kit tokens:
 * card background + border instead of the filled muted pill. Scoped here, not in the kit.
 */
const AUTH_FIELDS = cn(
  "[&_[data-slot=input]:not([data-code])]:h-11 [&_[data-slot=input]:not([data-code])]:rounded-xl",
  "[&_[data-slot=input]]:border-border [&_[data-slot=input]]:bg-card [&_[data-slot=input]]:shadow-(--shadow-soft)",
  "[&_[data-slot=input]:hover]:bg-card [&_[data-slot=input]:hover]:border-foreground/20",
);

/** Full-width auth actions: taller, softer-cornered than the kit's pill. */
export const AUTH_ACTION = "h-11 w-full rounded-xl text-[15px]";

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
    <div className={cn("w-full", AUTH_FIELDS)}>
      <BackHome />
      <h1 className="text-center text-4xl font-semibold tracking-[-0.035em] text-balance">{title}</h1>
      {subtitle && <p className="mt-2.5 text-center text-sm text-pretty text-muted-foreground">{subtitle}</p>}
      <div className="mt-9">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

function BackHome() {
  const t = useTranslations("common");
  return (
    <Link
      href="/"
      className="mb-10 inline-flex items-center gap-1 rounded-full py-1 pr-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
      {t("back")}
    </Link>
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

export { Field } from "@/components/shared/form-field";

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
      data-code
      inputMode="numeric"
      autoComplete="one-time-code"
      autoCapitalize="none"
      autoCorrect="off"
      enterKeyHint="done"
      placeholder="••••••"
      className={cn(
        "h-14 rounded-xl text-center font-mono text-2xl tracking-[0.4em] tabular-nums placeholder:text-muted-foreground/40",
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
      className={AUTH_ACTION}
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
      className={AUTH_ACTION}
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
 * Google's official "G" mark (public/brands/google-g.png, from Google's sign-in branding
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
      src="/brands/google-g.png"
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
        className={AUTH_ACTION}
        nativeButton={false}
        render={<Link href="/login" />}
      >
        {t("login.submit")}
      </Button>
    </AuthCard>
  );
}

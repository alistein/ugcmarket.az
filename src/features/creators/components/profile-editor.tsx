"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CreatorForm,
  CreatorSetupForm,
  type CreatorFormValues,
  creatorToForm,
  emptyCreatorForm,
  STEP_FIELDS,
  STEPS,
  type Step,
  toPayload,
} from "../form";
import {
  type MyCreator,
  useCreateCreator,
  useInvalidateMine,
  useMyCreator,
  useUpdateCreator,
} from "../hooks";
import { FormSection } from "./form-bits";
import { PortfolioEditor } from "./portfolio-editor";
import { LifestyleFields, TermsFields } from "./enhancer-fields";
import { AboutFields, ContentFields, SocialFields } from "./profile-sections";

/** /me/profile — setup wizard before the profile exists, sectioned editor after. */
export function ProfileEditorPage() {
  const t = useTranslations("common");
  const { data, isPending, isError } = useMyCreator();
  if (isPending) return <EditorSkeleton />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <ProfileEdit creator={data} /> : <ProfileSetup />;
}

/** Title + form sections (label column, fields column), like FormSection. */
function EditorSkeleton() {
  return (
    <LoadingState>
      <Skeleton className="mb-6 h-5 w-20" />
      <Skeleton className="h-9 w-60 max-w-full" />
      <Skeleton className="mt-2.5 h-4 w-80 max-w-full" />
      <div className="mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-x-12 gap-y-5 border-t border-border/70 py-10 first:border-t-0 first:pt-0 lg:grid-cols-[14rem_minmax(0,1fr)]"
          >
            <Skeleton className="h-6 w-32" />
            <div className="grid gap-5">
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-11 rounded-xl" />
              {i === 0 && <Skeleton className="h-24 rounded-xl" />}
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  );
}

function useServerErrors(form: ReturnType<typeof useForm<CreatorFormValues>>) {
  const te = useTranslations();
  return (e: unknown) => {
    if (e instanceof ApiClientError && e.code === "handle_taken") {
      form.setError("handle", { message: "errors.handle_taken" }, { shouldFocus: true });
      return;
    }
    const key = e instanceof ApiClientError ? e.message : "errors.unknown";
    toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
  };
}

/** Round back arrow, left of the page title (same as the listing page). */
function BackToMe() {
  const t = useTranslations("common");
  return (
    <Link
      href="/me"
      aria-label={t("back")}
      className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/80 outline-none [transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
    </Link>
  );
}

// ── Setup wizard ────────────────────────────────────────────────────────────
function ProfileSetup() {
  const t = useTranslations("creator");
  const router = useRouter();
  const [step, setStep] = useState<Step>("about");
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(CreatorSetupForm),
    defaultValues: emptyCreatorForm(),
    mode: "onTouched",
  });
  const create = useCreateCreator();
  const invalidateMine = useInvalidateMine();
  const onServerError = useServerErrors(form);
  const index = STEPS.indexOf(step);
  const last = index === STEPS.length - 1;

  const next = async () => {
    const ok = await form.trigger(STEP_FIELDS[step] as unknown as (keyof CreatorFormValues)[], {
      shouldFocus: true,
    });
    if (!ok) return;
    if (!last) {
      setStep(STEPS[index + 1]);
      window.scrollTo({ top: 0 });
      return;
    }
    await form.handleSubmit((v) =>
      create.mutate(toPayload(v), {
        onSuccess: (fresh) => {
          toast.success(t("setup.created"));
          // Leave first, then fill the cache (see useCreateCreator): /me shows the new profile.
          router.replace("/me");
          void invalidateMine(fresh);
        },
        onError: (e) => {
          if (e instanceof ApiClientError && e.code === "handle_taken") setStep("about");
          onServerError(e);
        },
      }),
    )();
  };

  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Stepper: vertical on wide screens, a progress bar on phones */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-sm font-medium text-primary tabular-nums">
          {t("setup.step", { current: index + 1, total: STEPS.length })}
        </p>
        <div className="mt-3 flex gap-1.5 lg:hidden" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= index && "bg-primary")} />
          ))}
        </div>
        <ol className="mt-5 hidden gap-1 lg:grid">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={i === index ? "step" : undefined}
              className="flex items-center gap-3 py-1.5 text-sm"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
                  i < index && "bg-mint text-mint-ink",
                  i === index && "bg-foreground text-background",
                  i > index && "text-muted-foreground ring-1 ring-border",
                )}
              >
                {i < index ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(i === index ? "font-medium" : "text-muted-foreground")}>
                {t(`steps.${s}.title`)}
              </span>
            </li>
          ))}
        </ol>
      </aside>

      <form
        noValidate
        className="grid min-w-0 grid-cols-1 content-start gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void next();
        }}
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {t(`steps.${step}.title`)}
          </h1>
          <p className="mt-1.5 text-muted-foreground">{t(`steps.${step}.subtitle`)}</p>
        </div>

        {step === "about" && <AboutFields form={form} />}
        {step === "content" && <ContentFields form={form} />}
        {step === "socials" && <SocialFields form={form} connect={false} />}

        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-border/70 pt-6">
          {index > 0 && (
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep(STEPS[index - 1])}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("setup.back")}
            </Button>
          )}
          <Button type="submit" size="lg" className="ml-auto min-w-40" disabled={create.isPending}>
            {last ? t("setup.finish") : t("setup.next")}
            {!last && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
function ProfileEdit({ creator }: { creator: MyCreator }) {
  const t = useTranslations("creator");
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(CreatorForm),
    values: creatorToForm(creator),
    resetOptions: { keepDirtyValues: true },
  });
  const update = useUpdateCreator();
  const onServerError = useServerErrors(form);
  const dirty = form.formState.isDirty;

  const save = form.handleSubmit(
    (v) =>
      update.mutate(toPayload(v), {
        onSuccess: (fresh) => {
          form.reset(creatorToForm(fresh));
          toast.success(t("edit.saved"));
        },
        onError: onServerError,
      }),
    () => toast.error(t("edit.fixErrors")),
  );

  return (
    <div>
      <div className="flex items-center gap-1">
        <BackToMe />
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("edit.title")}</h1>
      </div>
      <p className="mt-1.5 text-muted-foreground">{t("edit.subtitle")}</p>

      <form noValidate onSubmit={save} className="mt-8 grid grid-cols-1">
        <FormSection id="about" title={t("steps.about.title")}>
          <AboutFields form={form} currentHandle={creator.handle} />
        </FormSection>
        <FormSection id="content" title={t("steps.content.title")}>
          <ContentFields form={form} />
        </FormSection>
        <FormSection id="socials" title={t("steps.socials.title")}>
          <SocialFields form={form} />
        </FormSection>
        <FormSection id="lifestyle" title={t("sections.lifestyle.title")}>
          <LifestyleFields form={form} />
        </FormSection>
        <FormSection id="terms" title={t("sections.terms.title")}>
          <TermsFields form={form} />
        </FormSection>

        {/* Sticky save bar: above the mobile tab bar, only while there are unsaved changes. */}
        <div
          className={cn(
            "sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 rounded-2xl bg-card/95 p-3 pl-4 shadow-(--shadow-float) ring-1 ring-foreground/[0.06] backdrop-blur md:bottom-4",
            !dirty && "hidden",
          )}
        >
          <span className="text-sm text-muted-foreground">{t("edit.unsaved")}</span>
          <Button type="button" variant="ghost" className="ml-auto" onClick={() => form.reset()}>
            {t("edit.discard")}
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {t("edit.save")}
          </Button>
        </div>
      </form>

      <div className="*:border-t! *:pt-10!">
        <FormSection id="portfolio" title={t("portfolio.title")} description={t("portfolio.subtitle")}>
          <PortfolioEditor items={creator.portfolio_items} creator={creator} />
        </FormSection>
      </div>
    </div>
  );
}

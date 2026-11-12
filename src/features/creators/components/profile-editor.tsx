"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CreatorForm,
  type CreatorFormValues,
  creatorToForm,
  emptyCreatorForm,
  STEP_FIELDS,
  STEPS,
  type Step,
  toPayload,
} from "../form";
import { type MyCreator, useCreateCreator, useMyCreator, useUpdateCreator } from "../hooks";
import { FormSection } from "./form-bits";
import { PortfolioEditor } from "./portfolio-editor";
import { AboutFields, ContentFields, PriceFields, SocialFields } from "./profile-sections";

/** /me/profile — setup wizard before the profile exists, sectioned editor after. */
export function ProfileEditorPage() {
  const t = useTranslations("common");
  const { data, isPending, isError } = useMyCreator();
  if (isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <ProfileEdit creator={data} /> : <ProfileSetup />;
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

function BackToMe() {
  const t = useTranslations("common");
  return (
    <Link
      href="/me"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
      {t("back")}
    </Link>
  );
}

// ── Setup wizard ────────────────────────────────────────────────────────────
function ProfileSetup() {
  const t = useTranslations("creator");
  const router = useRouter();
  const [step, setStep] = useState<Step>("about");
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(CreatorForm),
    defaultValues: emptyCreatorForm(),
    mode: "onTouched",
  });
  const create = useCreateCreator();
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
        onSuccess: () => {
          toast.success(t("setup.created"));
          router.replace("/me");
        },
        onError: (e) => {
          if (e instanceof ApiClientError && e.code === "handle_taken") setStep("about");
          onServerError(e);
        },
      }),
    )();
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-medium text-primary tabular-nums">
        {t("setup.step", { current: index + 1, total: STEPS.length })}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{t(`steps.${step}.title`)}</h1>
      <p className="mt-1.5 text-muted-foreground">{t(`steps.${step}.subtitle`)}</p>
      <div className="mt-5 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= index && "bg-primary")} />
        ))}
      </div>

      <form
        noValidate
        className="mt-6 grid gap-5 rounded-3xl bg-card p-5 shadow-(--shadow-soft) ring-1 ring-foreground/[0.04] sm:p-7 dark:ring-white/[0.07]"
        onSubmit={(e) => {
          e.preventDefault();
          void next();
        }}
      >
        {step === "about" && <AboutFields form={form} />}
        {step === "content" && <ContentFields form={form} />}
        {step === "socials" && <SocialFields form={form} />}
        {step === "prices" && <PriceFields form={form} />}

        <div className="mt-2 flex items-center gap-2">
          {index > 0 && (
            <Button type="button" variant="ghost" size="lg" onClick={() => setStep(STEPS[index - 1])}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
              {t("setup.back")}
            </Button>
          )}
          <Button type="submit" size="lg" className="ml-auto min-w-36" disabled={create.isPending}>
            {last ? t("setup.finish") : t("setup.next")}
            {!last && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
          </Button>
        </div>
        {step === "prices" && (
          <p className="text-center text-xs text-muted-foreground">{t("setup.reviewNote")}</p>
        )}
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
    <div className="mx-auto max-w-2xl">
      <BackToMe />
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("edit.title")}</h1>
      <p className="mt-1.5 text-muted-foreground">{t("edit.subtitle")}</p>

      <form noValidate onSubmit={save} className="mt-6 grid gap-4">
        <FormSection id="about" title={t("steps.about.title")}>
          <AboutFields form={form} currentHandle={creator.handle} />
        </FormSection>
        <FormSection id="content" title={t("steps.content.title")}>
          <ContentFields form={form} />
        </FormSection>
        <FormSection id="socials" title={t("steps.socials.title")}>
          <SocialFields form={form} />
        </FormSection>
        <FormSection id="prices" title={t("steps.prices.title")}>
          <PriceFields form={form} />
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

      <div className="mt-4">
        <FormSection id="portfolio" title={t("portfolio.title")} description={t("portfolio.subtitle")}>
          <PortfolioEditor items={creator.portfolio_items} />
        </FormSection>
      </div>
    </div>
  );
}

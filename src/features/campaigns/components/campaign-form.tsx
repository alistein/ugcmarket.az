"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, InstagramIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useId, useState } from "react";
import { Controller, type FieldError, type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { SkeletonBack, SkeletonChips, SkeletonField } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { type MyBrand, useMyBrand } from "@/features/brands/hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CITIES,
  CREATOR_CATEGORIES,
  CampaignDraft,
  CampaignInput,
  type CampaignFormValues,
  type Deliverable,
  ENABLED_PRICE_FORMATS,
} from "@/schemas";
import {
  COMPENSATION_TYPES,
  MIN_FOLLOWER_OPTIONS,
  STEP_FIELDS,
  STEPS,
  type Step,
  emptyCampaignForm,
  localToday,
  toPayload,
} from "../form";
import { useCreateCampaign, useSetCampaignStatus } from "../hooks";
import { ChipGroup } from "@/features/creators/components/form-bits";
import { ChoiceChips, NumberStepper } from "./form-controls";
import { ListingCard } from "./listing-card";

export type CampaignForm = UseFormReturn<CampaignFormValues, unknown, CampaignInput>;

/** /brand/campaigns/new — needs a brand profile first. */
export function NewCampaignPage() {
  const t = useTranslations("common");
  const { data: brand, isPending, isError } = useMyBrand();
  // Next keeps this page mounted (hidden) after we leave it, so a finished wizard would come back
  // on its last step with the old values. A new key after each save starts the next one fresh.
  const [run, setRun] = useState(0);
  if (isPending) return <FormSkeleton />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return brand ? (
    <CreateCampaign key={run} brand={brand} onDone={() => setRun((n) => n + 1)} />
  ) : (
    <NeedsBrand />
  );
}

/**
 * Mirrors the listing form. "create": back, step bar, step 1 fields, footer, preview card.
 * "edit": back, status badge, title, the first section, preview card.
 */
export function FormSkeleton({ variant = "create" }: { variant?: "create" | "edit" }) {
  return (
    <LoadingState className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <SkeletonBack />
        {variant === "create" ? (
          <>
            <Skeleton className="h-4 w-20" />
            <div className="mt-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
              ))}
            </div>
            <Skeleton className="mt-6 h-9 w-64 max-w-full sm:h-10" />
          </>
        ) : (
          <>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="mt-3 h-9 w-72 max-w-full sm:h-10" />
          </>
        )}
        <Skeleton className="mt-2.5 h-5 w-full max-w-md" />
        {variant === "edit" && <Skeleton className="mt-8 h-7 w-40" />}
        <div className={cn("grid gap-6", variant === "create" ? "mt-6" : "mt-5")}>
          <SkeletonField labelWidth="w-28" />
          <SkeletonField textarea rows={6} labelWidth="w-20" />
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-32" />
            <SkeletonChips widths={["w-20", "w-20", "w-16", "w-40"]} />
            <Skeleton className="h-3 w-48" />
          </div>
          <SkeletonField textarea rows={3} labelWidth="w-20" />
          <SkeletonField labelWidth="w-32" className="sm:max-w-sm" />
        </div>
        {variant === "create" && (
          <div className="mt-8 flex justify-end gap-3 border-t border-border/70 pt-6">
            <Skeleton className="h-10 w-40 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        )}
      </div>
      <div className="hidden lg:block lg:pt-24">
        <Skeleton className="mb-3 h-4 w-48" />
        <div className="rounded-3xl bg-card p-5 shadow-(--shadow-raised)">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-[28%]" />
            <div className="grid gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
          <Skeleton className="mt-4 h-5 w-4/5" />
          <Skeleton className="mt-3 h-8 w-24" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="mt-4 border-t border-border/70 pt-3">
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </LoadingState>
  );
}

function NeedsBrand() {
  const t = useTranslations("campaign.form");
  return (
    <div className="mx-auto grid max-w-md justify-items-center py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-[-0.03em]">{t("needsBrandTitle")}</h1>
      <p className="mt-2 text-pretty text-muted-foreground">{t("needsBrandBody")}</p>
      <Button size="lg" className="mt-6" nativeButton={false} render={<Link href="/brand/profile" />}>
        {t("needsBrandCta")}
      </Button>
    </div>
  );
}

export function BackToBrand() {
  const t = useTranslations("common");
  return (
    <Link
      href="/brand"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
      {t("back")}
    </Link>
  );
}

// ── Create wizard ───────────────────────────────────────────────────────────
function CreateCampaign({ brand, onDone }: { brand: MyBrand; onDone: () => void }) {
  const t = useTranslations("campaign.form");
  const te = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>("what");
  const form: CampaignForm = useForm({
    resolver: zodResolver(CampaignInput),
    defaultValues: emptyCampaignForm(),
    mode: "onTouched",
  });
  const create = useCreateCampaign();
  const setStatus = useSetCampaignStatus();
  const busy = create.isPending || setStatus.isPending;
  const index = STEPS.indexOf(step);
  const last = index === STEPS.length - 1;
  const approved = brand.review_status === "approved";

  const onError = (e: unknown) => {
    const key = e instanceof ApiClientError ? e.message : "errors.unknown";
    toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
  };

  /** Back to the dashboard; the wizard resets in the same transition, so it never flashes empty. */
  const finish = () =>
    startTransition(() => {
      router.replace("/brand");
      onDone();
    });

  const goTo = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };

  const next = async () => {
    const ok = await form.trigger([...STEP_FIELDS[step]], { shouldFocus: true });
    if (ok) goTo(STEPS[index + 1]);
  };

  const jumpToFirstError = (errors: object) => {
    const bad = STEPS.find((s) => STEP_FIELDS[s].some((f) => f in errors));
    if (bad && bad !== step) goTo(bad);
    toast.error(t("fixErrors"));
  };

  /** Draft: whatever is filled in so far (only types and limits are checked). */
  const saveDraft = async () => {
    const draft = parseDraft(form);
    if (!draft) return jumpToFirstError(form.formState.errors);
    try {
      await create.mutateAsync(toPayload(draft));
      toast.success(t("savedDraft"));
      finish();
    } catch (e) {
      onError(e);
    }
  };

  /** Publish: the complete listing. Created as a draft, then published (the API decides review vs live). */
  const publish = form.handleSubmit(async (v) => {
    try {
      const created = await create.mutateAsync(toPayload(v));
      const res = await setStatus.mutateAsync({ id: created.id, status: "published" });
      toast.success(res.status === "published" ? t("published") : t("sentForReview"));
      finish();
    } catch (e) {
      onError(e);
    }
  }, jumpToFirstError);

  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <BackToBrand />
        <p className="text-sm font-medium text-primary tabular-nums">
          {t("step", { current: index + 1, total: STEPS.length })}
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= index && "bg-primary")} />
          ))}
        </div>

        <form
          noValidate
          className="mt-6 grid grid-cols-1 content-start gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (last) void publish();
            else void next();
          }}
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {t(`steps.${step}.title`)}
            </h1>
            <p className="mt-1.5 text-pretty text-muted-foreground">{t(`steps.${step}.subtitle`)}</p>
          </div>

          {step === "what" && <WhatFields form={form} />}
          {step === "who" && <WhoFields form={form} />}
          {step === "pay" && <PayFields form={form} />}

          <div className="mt-2 grid gap-4 border-t border-border/70 pt-6">
            {last && !approved && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
                {t("reviewNote")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {index > 0 && (
                <Button type="button" variant="ghost" size="lg" onClick={() => goTo(STEPS[index - 1])}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                  {t("back")}
                </Button>
              )}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                {/* Any step: a draft doesn't need the required fields yet. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={busy}
                  onClick={() => void saveDraft()}
                >
                  {t("saveDraft")}
                </Button>
                <Button type="submit" size="lg" className="min-w-36" disabled={busy}>
                  {last ? t("publish") : t("next")}
                  {!last && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Preview form={form} brand={brand} />
    </div>
  );
}

/**
 * Checks the form against the draft rules (types and limits, nothing required), shows any
 * problems on the fields, and returns the draft payload, or null when something is wrong.
 */
export function parseDraft(form: CampaignForm): CampaignDraft | null {
  form.clearErrors();
  const r = CampaignDraft.safeParse(form.getValues());
  if (r.success) return r.data;
  for (const issue of r.error.issues) {
    const field = issue.path[0] as keyof CampaignFormValues | undefined;
    if (field) form.setError(field, { message: issue.message }, { shouldFocus: true });
  }
  return null;
}

/** Desktop only: the listing card updating as the brand types. */
export function Preview({ form, brand }: { form: CampaignForm; brand: MyBrand }) {
  const t = useTranslations("campaign.form");
  const v = useWatch({ control: form.control });
  const value = Number(v.compensation_value);
  return (
    <aside className="hidden lg:sticky lg:top-8 lg:block lg:self-start lg:pt-24">
      <p className="mb-3 text-sm text-muted-foreground">{t("previewLabel")}</p>
      <ListingCard
        data={{
          title: typeof v.title === "string" ? v.title.trim() : "",
          brand: { name: brand.name, logo_url: brand.logo_url },
          category: v.category as string | undefined,
          deliverables: ((v.deliverables ?? []) as Partial<Deliverable>[]).flatMap((d) =>
            d?.format ? [{ format: d.format, count: Number(d.count) || 1 }] : [],
          ),
          compensation_type: (v.compensation_type as string) ?? "money",
          compensation_value: Number.isFinite(value) && value > 0 ? value : null,
          compensation_details:
            typeof v.compensation_details === "string" ? v.compensation_details.trim() : null,
          currency: "AZN",
          city: (v.city as string) || null,
          deadline: (v.deadline as string) || null,
          min_followers: Number(v.min_followers) || 0,
        }}
      />
    </aside>
  );
}

// ── Step 1: what (the brief) ────────────────────────────────────────────────
export function WhatFields({ form }: { form: CampaignForm }) {
  const t = useTranslations("campaign.form");
  const tt = useTranslations("taxonomy");
  const { register, control, formState } = form;
  const errors = formState.errors;
  const description = useWatch({ control, name: "description" });
  const descLength = typeof description === "string" ? description.length : 0;

  return (
    <div className="grid gap-6">
      <Field required label={t("title")} error={errors.title} hint={t("titleHint")}>
        {(a) => <Input {...a} {...register("title")} maxLength={120} placeholder={t("titlePh")} />}
      </Field>
      <Field
        required
        label={t("description")}
        error={errors.description}
        hint={t("descriptionHint")}
        aside={<span className="text-xs text-muted-foreground tabular-nums">{descLength}/4000</span>}
      >
        {(a) => (
          <Textarea
            {...a}
            {...register("description")}
            rows={6}
            maxLength={4000}
            placeholder={t("descriptionPh")}
          />
        )}
      </Field>
      <Field required label={t("format")} error={errors.deliverables as FieldError | undefined}>
        {(a) => (
          <Controller
            control={control}
            name="deliverables"
            render={({ field }) => (
              <DeliverablesInput
                value={(field.value ?? []) as Deliverable[]}
                onChange={field.onChange}
                invalid={a["aria-invalid"]}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
      <Field required label={t("requirements")} error={errors.requirements}>
        {(a) => (
          <Textarea
            {...a}
            {...register("requirements")}
            rows={3}
            maxLength={2000}
            placeholder={t("requirementsPh")}
          />
        )}
      </Field>
      <div className="grid gap-5 sm:max-w-sm">
        <Field required label={t("category")} error={errors.category}>
          {(a) => (
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  items={CREATOR_CATEGORIES.map((c) => ({ value: c, label: tt(`categories.${c}`) }))}
                  value={(field.value as string | undefined) || null}
                  onValueChange={(v) => field.onChange(v ?? undefined)}
                >
                  <SelectTrigger
                    id={a.id}
                    aria-invalid={a["aria-invalid"]}
                    aria-describedby={a["aria-describedby"]}
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder={t("categoryPh")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {tt(`categories.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      </div>
    </div>
  );
}

// ── Step 2: who (the creators) ──────────────────────────────────────────────
export function WhoFields({ form }: { form: CampaignForm }) {
  const t = useTranslations("campaign.form");
  const tt = useTranslations("taxonomy");
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const { control, formState } = form;
  const errors = formState.errors;
  const creatorsId = useId();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor={creatorsId} className="text-sm font-medium">
          {t("creatorsNeeded")}
        </label>
        <Controller
          control={control}
          name="creators_needed"
          render={({ field }) => (
            <NumberStepper
              id={creatorsId}
              value={Number(field.value) || 1}
              onChange={field.onChange}
              min={1}
              max={100}
              decreaseLabel={t("less")}
              increaseLabel={t("more")}
            />
          )}
        />
      </div>
      <Field label={t("minFollowers")} error={errors.min_followers} hint={t("minFollowersHint")}>
        {(a) => (
          <Controller
            control={control}
            name="min_followers"
            render={({ field }) => (
              <ChoiceChips
                ariaLabel={t("minFollowers")}
                options={MIN_FOLLOWER_OPTIONS}
                value={Number(field.value) as (typeof MIN_FOLLOWER_OPTIONS)[number]}
                onChange={field.onChange}
                label={(n) => (n === 0 ? t("anyone") : `${compact.format(n)}+`)}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
      <Field label={t("city")} error={errors.city} className="sm:max-w-xs">
        {(a) => (
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select
                items={[
                  { value: "any", label: t("anyCity") },
                  ...CITIES.map((c) => ({ value: c, label: tt(`cities.${c}`) })),
                ]}
                value={(field.value as string) || "any"}
                onValueChange={(v) => field.onChange(!v || v === "any" ? "" : v)}
              >
                <SelectTrigger
                  id={a.id}
                  aria-invalid={a["aria-invalid"]}
                  aria-describedby={a["aria-describedby"]}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("anyCity")}</SelectItem>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tt(`cities.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
    </div>
  );
}

/**
 * Formats as chips; each chosen format gets its own count below ("3 × Reels, 1 × Stories").
 * Order follows the chips, so the listing reads the same everywhere.
 */
function DeliverablesInput({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: Deliverable[];
  onChange: (v: Deliverable[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const t = useTranslations("campaign.form");
  const tt = useTranslations("taxonomy");
  const counts = new Map(value.map((d) => [d.format, d.count]));

  const pick = (formats: (typeof ENABLED_PRICE_FORMATS)[number][]) =>
    onChange(
      ENABLED_PRICE_FORMATS.filter((f) => formats.includes(f)).map((f) => ({
        format: f,
        count: counts.get(f) ?? 1,
      })),
    );
  const setCount = (format: string, count: number) =>
    onChange(value.map((d) => (d.format === format ? { ...d, count } : d)));

  return (
    <div className="grid gap-4">
      <ChipGroup
        options={ENABLED_PRICE_FORMATS}
        value={value.map((d) => d.format) as (typeof ENABLED_PRICE_FORMATS)[number][]}
        onChange={pick}
        label={(f) => tt(`formats.${f}`)}
        invalid={invalid}
        describedBy={describedBy}
      />
      <div className="-mt-2 grid gap-1 text-xs text-muted-foreground">
        <p>{t("formatHint")}</p>
        <p className="flex items-center gap-1.5">
          <HugeiconsIcon icon={InstagramIcon} strokeWidth={2} className="size-3.5 shrink-0" />
          {t("networkNote")}
        </p>
      </div>
      {value.length > 0 && (
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">{t("countsLabel")}</p>
          <ul className="grid">
            {value.map((d) => {
              const name = tt(`formats.${d.format}` as never);
              return (
                <li key={d.format} className="flex items-center justify-between gap-4 py-1.5 sm:max-w-sm">
                  <span className="font-medium">{name}</span>
                  <NumberStepper
                    value={d.count}
                    onChange={(n) => setCount(d.format, n)}
                    min={1}
                    max={20}
                    decreaseLabel={`${t("less")}: ${name}`}
                    increaseLabel={`${t("more")}: ${name}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Step 3: pay and deadline (the offer) ────────────────────────────────────
export function PayFields({ form }: { form: CampaignForm }) {
  const t = useTranslations("campaign.form");
  const tt = useTranslations("taxonomy");
  const { register, control, formState } = form;
  const errors = formState.errors;
  const type = useWatch({ control, name: "compensation_type" });

  return (
    <div className="grid gap-6">
      <Field label={t("compensation")} error={errors.compensation_type}>
        {(a) => (
          <Controller
            control={control}
            name="compensation_type"
            render={({ field }) => (
              <ChoiceChips
                ariaLabel={t("compensation")}
                options={COMPENSATION_TYPES}
                value={field.value as (typeof COMPENSATION_TYPES)[number]}
                onChange={field.onChange}
                label={(c) => tt(`compensation.${c}`)}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      {(type === "money" || type === "bid") && (
        // Paid: the amount. Bid: an optional ceiling, creators name their price when applying.
        // Either way an optional extra on top: a product, a service or both.
        <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <Field
            required={type === "money"}
            label={t(type === "bid" ? "budget" : "amount")}
            hint={type === "bid" ? t("budgetHint") : undefined}
            error={errors.compensation_value}
          >
            {(a) => (
              <div className="relative">
                <Input
                  {...a}
                  {...register("compensation_value")}
                  inputMode="decimal"
                  placeholder={type === "bid" ? "500" : "150"}
                  className="pr-14 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
                  AZN
                </span>
              </div>
            )}
          </Field>
          <Field label={t("extra")} error={errors.compensation_details}>
            {(a) => (
              <Input
                {...a}
                {...register("compensation_details")}
                maxLength={300}
                placeholder={t("extraPh")}
              />
            )}
          </Field>
        </div>
      )}
      {type === "barter" && (
        <Field label={t("offer")} error={errors.compensation_details} hint={t("offerHint")}>
          {(a) => (
            <Input {...a} {...register("compensation_details")} maxLength={300} placeholder={t("offerPh")} />
          )}
        </Field>
      )}
      {type === "unpaid" && <p className="-mt-2 text-sm text-muted-foreground">{t("unpaidHint")}</p>}

      <Field
        required
        label={t("deadline")}
        error={errors.deadline}
        hint={t("deadlineHint")}
        className="sm:max-w-xs"
      >
        {(a) => <Input {...a} {...register("deadline")} type="date" min={localToday()} />}
      </Field>
    </div>
  );
}

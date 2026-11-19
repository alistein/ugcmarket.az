"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Controller, type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/form-field";
import { LoadingState } from "@/components/shared/loading-state";
import { SkeletonBack, SkeletonField } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarField, FormSection } from "@/features/creators/components/form-bits";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { BRAND_CATEGORIES, BrandProfileInput, type BrandProfileFormValues } from "@/schemas";
import { type MyBrand, useCreateBrand, useMyBrand, useUpdateBrand } from "../hooks";

type Form = UseFormReturn<BrandProfileFormValues, unknown, BrandProfileInput>;

const EMPTY: BrandProfileFormValues = {
  name: "",
  logo_url: null,
  category: undefined as unknown as BrandProfileFormValues["category"],
  website: "",
  contact_instagram: "",
  contact_phone: "",
  contact_email: "",
};

function toForm(b: MyBrand): BrandProfileFormValues {
  return {
    name: b.name,
    logo_url: b.logo_url,
    category: b.category as BrandProfileFormValues["category"],
    website: b.website ?? "",
    contact_instagram: b.brand_contacts?.instagram ?? "",
    contact_phone: b.brand_contacts?.phone ?? "",
    contact_email: b.brand_contacts?.email ?? "",
  };
}

/** /brand/profile — one short form: creates the brand the first time, edits it after. */
export function BrandProfilePage() {
  const t = useTranslations("common");
  const { data, isPending, isError } = useMyBrand();
  if (isPending) return <FormSkeleton />;
  if (isError)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadFailed")}
      </p>
    );
  return data ? <EditBrand brand={data} /> : <CreateBrand />;
}

/** Mirrors the profile form: title, then the two FormSections (label column + fields). */
function FormSkeleton() {
  const section =
    "grid grid-cols-1 gap-x-12 gap-y-5 border-t border-border/70 py-10 first:border-t-0 first:pt-0 lg:grid-cols-[14rem_minmax(0,1fr)]";
  const label = (
    <div className="grid content-start gap-2">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-44" />
    </div>
  );
  return (
    <LoadingState>
      <SkeletonBack />
      <Skeleton className="h-9 w-80 max-w-full sm:h-10" />
      <Skeleton className="mt-2.5 h-5 w-full max-w-lg" />
      <div className="mt-8">
        <div className={section}>
          {label}
          <div className="grid min-w-0 gap-5">
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 shrink-0 rounded-[28%]" />
              <div className="grid gap-1.5">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <SkeletonField />
              <SkeletonField labelWidth="w-28" />
            </div>
            <SkeletonField labelWidth="w-12" />
          </div>
        </div>
        <div className={section}>
          {label}
          <div className="grid min-w-0 gap-5">
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="grid gap-5 sm:grid-cols-2">
              <SkeletonField labelWidth="w-20" />
              <SkeletonField labelWidth="w-16" />
              <SkeletonField labelWidth="w-14" />
            </div>
          </div>
        </div>
      </div>
    </LoadingState>
  );
}

function BackToBrand() {
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

function useServerError() {
  const t = useTranslations();
  return (e: unknown) => {
    const key = e instanceof ApiClientError ? e.message : "errors.unknown";
    toast.error(t.has(key as never) ? t(key as never) : t("errors.unknown"));
  };
}

// ── First time ──────────────────────────────────────────────────────────────
function CreateBrand() {
  const t = useTranslations("brand.profile");
  const router = useRouter();
  const form: Form = useForm({
    resolver: zodResolver(BrandProfileInput),
    defaultValues: EMPTY,
    mode: "onTouched",
  });
  const create = useCreateBrand();
  const onError = useServerError();

  const submit = form.handleSubmit((v) =>
    create.mutate(v, {
      onSuccess: () => {
        toast.success(t("created"));
        router.replace("/brand");
      },
      onError,
    }),
  );

  return (
    <div>
      <BackToBrand />
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
        {t("createTitle")}
      </h1>
      <p className="mt-1.5 text-pretty text-muted-foreground">{t("createSubtitle")}</p>

      <form noValidate onSubmit={submit} className="mt-8 grid grid-cols-1">
        <BrandFields form={form} />
        <div className="flex flex-col-reverse gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-pretty text-muted-foreground">{t("reviewNote")}</p>
          <Button type="submit" size="lg" className="min-w-40 sm:ml-auto" disabled={create.isPending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Edit ────────────────────────────────────────────────────────────────────
function EditBrand({ brand }: { brand: MyBrand }) {
  const t = useTranslations("brand.profile");
  const form: Form = useForm({
    resolver: zodResolver(BrandProfileInput),
    values: toForm(brand),
    resetOptions: { keepDirtyValues: true },
  });
  const update = useUpdateBrand();
  const onError = useServerError();
  const dirty = form.formState.isDirty;

  const save = form.handleSubmit(
    (v) =>
      update.mutate(v, {
        onSuccess: (fresh) => {
          form.reset(toForm(fresh));
          toast.success(t("saved"));
        },
        onError,
      }),
    () => toast.error(t("fixErrors")),
  );

  return (
    <div>
      <BackToBrand />
      <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t("editTitle")}</h1>
      <p className="mt-1.5 text-pretty text-muted-foreground">{t("editSubtitle")}</p>

      <form noValidate onSubmit={save} className="mt-8 grid grid-cols-1">
        <BrandFields form={form} />

        {/* Sticky save bar, only while there are unsaved changes. */}
        <div
          className={cn(
            "sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 rounded-2xl bg-card/95 p-3 pl-4 shadow-(--shadow-float) ring-1 ring-foreground/[0.06] backdrop-blur",
            !dirty && "hidden",
          )}
        >
          <span className="text-sm text-muted-foreground">{t("unsaved")}</span>
          <Button type="button" variant="ghost" className="ml-auto" onClick={() => form.reset()}>
            {t("discard")}
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Fields (shared by both) ─────────────────────────────────────────────────
function BrandFields({ form }: { form: Form }) {
  const t = useTranslations("brand.profile");
  const ts = useTranslations("brand.steps");
  const tc = useTranslations("taxonomy.brandCategories");
  const { register, control, formState } = form;
  const errors = formState.errors;
  const name = useWatch({ control, name: "name" });

  return (
    <>
      <FormSection title={ts("about.title")} description={ts("about.subtitle")}>
        <Controller
          control={control}
          name="logo_url"
          render={({ field }) => (
            <AvatarField
              logo
              value={(field.value as string | null) ?? null}
              name={typeof name === "string" ? name : ""}
              onChange={(v) => field.onChange(v)}
              labels={{
                label: t("logo"),
                hint: t("logoHint"),
                remove: t("logoRemove"),
                cropHint: t("logoCrop"),
              }}
            />
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field required label={t("name")} error={errors.name}>
            {(a) => (
              <Input {...a} {...register("name")} autoComplete="organization" placeholder={t("namePh")} />
            )}
          </Field>
          <Field required label={t("category")} error={errors.category}>
            {(a) => (
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    items={BRAND_CATEGORIES.map((c) => ({ value: c, label: tc(c) }))}
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
                      {BRAND_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {tc(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
          <Field className="sm:col-span-2" label={t("website")} error={errors.website}>
            {(a) => (
              <Input
                {...a}
                {...register("website")}
                type="url"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="nurkafe.az"
              />
            )}
          </Field>
        </div>
      </FormSection>

      <FormSection title={ts("contacts.title")} description={ts("contacts.subtitle")}>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {t("contactsHint")}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field required label={t("instagram")} error={errors.contact_instagram}>
            {(a) => (
              <Input
                {...a}
                {...register("contact_instagram")}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="@"
              />
            )}
          </Field>
          <Field required label={t("phone")} error={errors.contact_phone}>
            {(a) => (
              <Input
                {...a}
                {...register("contact_phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+994 50 123 45 67"
              />
            )}
          </Field>
          <Field required label={t("email")} error={errors.contact_email}>
            {(a) => (
              <Input
                {...a}
                {...register("contact_email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="info@nurkafe.az"
              />
            )}
          </Field>
        </div>
      </FormSection>
    </>
  );
}

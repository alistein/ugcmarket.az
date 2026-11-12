"use client";

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InstagramIcon,
  Loading03Icon,
  LockIcon,
  RefreshIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  CITIES,
  CONTENT_LANGUAGES,
  CREATOR_CATEGORIES,
  CreatorHandle,
  ENABLED_PRICE_FORMATS,
  SocialUsername,
} from "@/schemas";
import { type CreatorFormValues, NETWORKS, suggestHandle } from "../form";
import { useHandleAvailability, useLookupSocial } from "../hooks";
import { AvatarField, ChipGroup } from "./form-bits";

type Form = UseFormReturn<CreatorFormValues>;

export const NETWORK_ICON = { instagram: InstagramIcon, tiktok: TiktokIcon, youtube: YoutubeIcon } as const;
export const NETWORK_TINT = {
  instagram: "bg-rose text-rose-ink",
  tiktok: "bg-sky text-sky-ink",
  youtube: "bg-sun text-sun-ink",
} as const;

// ── About ───────────────────────────────────────────────────────────────────
export function AboutFields({ form, currentHandle }: { form: Form; currentHandle?: string }) {
  const t = useTranslations("creator.form");
  const tt = useTranslations("taxonomy");
  const { register, control, setValue, getFieldState, formState } = form;
  const errors = formState.errors;
  const name = useWatch({ control, name: "display_name" });
  const bio = useWatch({ control, name: "bio" }) ?? "";

  // Suggest a handle from the name until the user edits the handle themselves.
  useEffect(() => {
    if (currentHandle || getFieldState("handle").isDirty) return;
    setValue("handle", suggestHandle(name ?? ""), { shouldValidate: false });
  }, [name, currentHandle, setValue, getFieldState]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Controller
          control={control}
          name="avatar_url"
          render={({ field }) => (
            <AvatarField value={field.value} name={name ?? ""} onChange={(v) => field.onChange(v)} />
          )}
        />
      </div>
      <Field label={t("displayName")} error={errors.display_name}>
        {(a) => (
          <Input {...a} {...register("display_name")} autoComplete="name" placeholder={t("displayNamePh")} />
        )}
      </Field>
      <HandleField form={form} currentHandle={currentHandle} />
      <Field label={t("city")} error={errors.city}>
        {(a) => (
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select
                items={CITIES.map((c) => ({ value: c, label: tt(`cities.${c}`) }))}
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger
                  id={a.id}
                  aria-invalid={a["aria-invalid"]}
                  aria-describedby={a["aria-describedby"]}
                  className="w-full"
                >
                  <SelectValue placeholder={t("cityPh")} />
                </SelectTrigger>
                <SelectContent>
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
      <Field
        className="sm:col-span-2"
        label={t("bio")}
        error={errors.bio}
        hint={t("bioHint")}
        aside={<span className="text-xs text-muted-foreground tabular-nums">{bio.length}/600</span>}
      >
        {(a) => <Textarea {...a} {...register("bio")} rows={4} maxLength={600} placeholder={t("bioPh")} />}
      </Field>
    </div>
  );
}

function HandleField({ form, currentHandle }: { form: Form; currentHandle?: string }) {
  const t = useTranslations("creator.form");
  const { register, control, formState } = form;
  const handle = useWatch({ control, name: "handle" }) ?? "";
  const [debounced, setDebounced] = useState(handle);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(handle), 400);
    return () => clearTimeout(id);
  }, [handle]);

  const valid = CreatorHandle.safeParse(debounced).success;
  const unchanged = !!currentHandle && debounced.toLowerCase() === currentHandle;
  const check = useHandleAvailability(debounced.toLowerCase(), valid && !unchanged);
  // Only say "taken" on an explicit `available: false`. A failed check (network, server)
  // shows nothing — the server still rejects a duplicate on save.
  const status =
    !valid || unchanged || debounced !== handle || check.isError
      ? null
      : check.isPending
        ? "checking"
        : check.data?.available === true
          ? "free"
          : check.data?.available === false
            ? "taken"
            : null;

  return (
    <Field
      label={t("handle")}
      error={formState.errors.handle ?? (status === "taken" ? { message: "errors.handle_taken" } : undefined)}
      hint={status === "free" ? t("handleFree", { handle: debounced.toLowerCase() }) : t("handleHint")}
    >
      {(a) => (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">
            @
          </span>
          <Input
            {...a}
            {...register("handle")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="pr-9 pl-8"
          />
          {status === "free" && (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              strokeWidth={2}
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mint-ink"
            />
          )}
          {status === "taken" && (
            <HugeiconsIcon
              icon={Alert02Icon}
              strokeWidth={2}
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-destructive"
            />
          )}
        </div>
      )}
    </Field>
  );
}

// ── Content ─────────────────────────────────────────────────────────────────
export function ContentFields({ form }: { form: Form }) {
  const t = useTranslations("creator.form");
  const tt = useTranslations("taxonomy");
  const { control, formState } = form;
  return (
    <>
      <Field label={t("categories")} error={formState.errors.categories} hint={t("categoriesHint")}>
        {(a) => (
          <Controller
            control={control}
            name="categories"
            render={({ field }) => (
              <ChipGroup
                options={CREATOR_CATEGORIES}
                value={field.value}
                onChange={field.onChange}
                label={(c) => tt(`categories.${c}`)}
                max={5}
                invalid={a["aria-invalid"]}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
      <Field label={t("languages")} error={formState.errors.languages}>
        {(a) => (
          <Controller
            control={control}
            name="languages"
            render={({ field }) => (
              <ChipGroup
                options={CONTENT_LANGUAGES}
                value={field.value}
                onChange={field.onChange}
                label={(l) => tt(`languages.${l}`)}
                invalid={a["aria-invalid"]}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
    </>
  );
}

// ── Socials + private contacts ─────────────────────────────────────────────
export function SocialFields({ form }: { form: Form }) {
  const t = useTranslations("creator.form");
  const { register, formState } = form;
  const errors = formState.errors.socials;
  const rootError = (errors as { root?: { message?: string } } | undefined)?.root;
  return (
    <>
      <p className="-mt-2 text-sm text-muted-foreground">{t("socialsHint")}</p>
      {NETWORKS.map((n) => (
        <SocialConnectRow
          key={n}
          form={form}
          network={n}
          rootError={n === "instagram" ? rootError : undefined}
        />
      ))}
      <p className="text-sm text-muted-foreground">{t("moreNetworksSoon")}</p>
      <div className="grid gap-4 pt-1 md:grid-cols-2">
        <p className="flex items-start gap-2 text-sm text-muted-foreground md:col-span-2">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {t("contactsHint")}
        </p>
        <Field label={t("contactInstagram")} error={formState.errors.contact_instagram}>
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
        <Field label={t("contactPhone")} error={formState.errors.contact_phone}>
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
      </div>
    </>
  );
}

/**
 * One network: username + "Connect account". Followers / avg views are never typed; they come
 * from the API lookup and are shown read-only. Editing the username clears them.
 */
function SocialConnectRow({
  form,
  network,
  rootError,
}: {
  form: Form;
  network: (typeof NETWORKS)[number];
  rootError?: { message?: string };
}) {
  const t = useTranslations("creator.form");
  const te = useTranslations();
  const locale = useLocale();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const { register, control, setValue, getValues, formState } = form;
  const e = formState.errors.socials?.[network];
  const followers = useWatch({ control, name: `socials.${network}.followers` });
  const avgViews = useWatch({ control, name: `socials.${network}.avg_views` });
  const lookup = useLookupSocial();
  const [error, setError] = useState<string | null>(null);
  const connected = !!followers;

  const field = register(`socials.${network}.handle`);

  const connect = () => {
    const raw = getValues(`socials.${network}.handle`);
    const parsed = SocialUsername.safeParse(raw);
    if (!parsed.success) {
      form.setError(`socials.${network}.handle`, { message: "validation.socialHandle" });
      return;
    }
    setError(null);
    lookup.mutate(
      { network, handle: parsed.data },
      {
        onSuccess: (r) => {
          setValue(`socials.${network}.handle`, r.handle, { shouldDirty: true });
          setValue(`socials.${network}.followers`, String(r.followers), { shouldDirty: true });
          setValue(`socials.${network}.avg_views`, r.avg_views == null ? "" : String(r.avg_views), {
            shouldDirty: true,
          });
          form.clearErrors(`socials.${network}`);
        },
        onError: (err) => {
          const key = err instanceof ApiClientError ? err.message : "errors.unknown";
          setError(te.has(key as never) ? te(key as never) : te("errors.unknown"));
        },
      },
    );
  };

  return (
    <div className="grid gap-3 border-b border-border/70 pb-5 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium md:pt-8">
        <span className={cn("flex size-7 items-center justify-center rounded-full", NETWORK_TINT[network])}>
          <HugeiconsIcon icon={NETWORK_ICON[network]} strokeWidth={2} className="size-4" />
        </span>
        {t(`network.${network}`)}
      </div>
      <div className="grid gap-3">
        <Field
          label={t("username")}
          error={e?.handle ?? rootError}
          hint={lookup.isPending ? t("connecting") : undefined}
        >
          {(a) => (
            <div className="flex gap-2">
              <Input
                {...a}
                {...field}
                onChange={(ev) => {
                  void field.onChange(ev);
                  // A different account: previous numbers no longer apply.
                  if (getValues(`socials.${network}.followers`)) {
                    setValue(`socials.${network}.followers`, "");
                    setValue(`socials.${network}.avg_views`, "");
                  }
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    connect();
                  }
                }}
                disabled={lookup.isPending}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="@"
                className="flex-1"
              />
              <Button
                type="button"
                variant={connected ? "outline" : "default"}
                disabled={lookup.isPending}
                onClick={connect}
                className="shrink-0"
              >
                {lookup.isPending ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    strokeWidth={2}
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : connected ? (
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                ) : null}
                {connected ? t("reconnect") : t("connect")}
              </Button>
            </div>
          )}
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {connected && !lookup.isPending && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>
              <span className="text-lg font-semibold tracking-[-0.02em] tabular-nums">
                {compact.format(Number(followers))}
              </span>{" "}
              <span className="text-sm text-muted-foreground">{t("statFollowers")}</span>
            </span>
            {avgViews && (
              <span>
                <span className="text-lg font-semibold tracking-[-0.02em] tabular-nums">
                  {compact.format(Number(avgViews))}
                </span>{" "}
                <span className="text-sm text-muted-foreground">{t("statAvgViews")}</span>
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-mint-ink">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" />
              {t("connected")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Prices ─────────────────────────────────────────────────────────────────
export function PriceFields({ form }: { form: Form }) {
  const t = useTranslations("creator.form");
  const tt = useTranslations("taxonomy");
  const { register, formState } = form;
  return (
    <>
      <p className="-mt-2 text-sm text-muted-foreground">{t("pricesHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENABLED_PRICE_FORMATS.map((f) => (
          <Field key={f} label={tt(`formats.${f}`)} error={formState.errors.prices?.[f]}>
            {(a) => (
              <div className="relative">
                <Input
                  {...a}
                  {...register(`prices.${f}`)}
                  inputMode="decimal"
                  placeholder="0"
                  className="pr-14 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                  AZN
                </span>
              </div>
            )}
          </Field>
        ))}
      </div>
      <div className="grid gap-3 border-t border-border/70 pt-5">
        <div className="grid gap-0.5">
          <p className="text-sm font-semibold">{t("termsTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("termsHint")}</p>
        </div>
        {(["barter_open", "repost_open"] as const).map((name) => (
          <label key={name} className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" {...register(name)} className="mt-0.5 size-5 accent-[var(--primary)]" />
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{t(name === "barter_open" ? "barter" : "repost")}</span>
              <span className="text-sm text-muted-foreground">
                {t(name === "barter_open" ? "barterHint" : "repostHint")}
              </span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

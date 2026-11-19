"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type MyBrand, useMyBrand } from "@/features/brands/hooks";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CampaignInput } from "@/schemas";
import { campaignToForm, toPayload } from "../form";
import { type OwnCampaign, useOwnCampaign, useSetCampaignStatus, useUpdateCampaign } from "../hooks";
import {
  BackToBrand,
  type CampaignForm,
  FormSkeleton,
  PayFields,
  parseDraft,
  Preview,
  WhatFields,
  WhoFields,
} from "./campaign-form";

/** /brand/campaigns/[id]/edit — the create form's three parts as sections on one page. */
export function EditCampaignPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const campaign = useOwnCampaign(id);
  const brand = useMyBrand();

  if (campaign.isPending || brand.isPending) return <FormSkeleton variant="edit" />;
  if (campaign.isError || brand.isError || !brand.data) {
    const notFound = campaign.error instanceof ApiClientError && campaign.error.status === 404;
    return (
      <div>
        <BackToBrand />
        <p role="alert" className="text-sm text-destructive">
          {notFound ? t("errors.notFound.campaign") : t("common.loadFailed")}
        </p>
      </div>
    );
  }
  if (campaign.data.status === "closed")
    return (
      <div>
        <BackToBrand />
        <p className="text-muted-foreground">{t("campaign.edit.closed")}</p>
      </div>
    );
  return <EditForm campaign={campaign.data} brand={brand.data} />;
}

const STATUS_BADGE = {
  draft: "secondary",
  pending_review: "sun",
  published: "mint",
  paused: "sky",
  closed: "secondary",
  rejected: "rose",
} as const;

function EditForm({ campaign, brand }: { campaign: OwnCampaign; brand: MyBrand }) {
  const t = useTranslations("campaign.edit");
  const tf = useTranslations("campaign.form");
  const tm = useTranslations("campaign.mine");
  const te = useTranslations();
  const form: CampaignForm = useForm({
    resolver: zodResolver(CampaignInput),
    values: campaignToForm(campaign),
    resetOptions: { keepDirtyValues: true },
  });
  const update = useUpdateCampaign(campaign.id);
  const setStatus = useSetCampaignStatus();
  const router = useRouter();
  const dirty = form.formState.isDirty;
  const live = campaign.status === "published" || campaign.status === "paused";
  const isDraft = campaign.status === "draft";
  const busy = update.isPending || setStatus.isPending;

  const onError = (e: unknown) => {
    const key = e instanceof ApiClientError ? e.message : "errors.unknown";
    toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
  };
  const onSaved = (fresh: OwnCampaign) => {
    form.reset(campaignToForm(fresh));
    toast.success(t("saved"));
  };

  /** Drafts save whatever is filled in; other listings must stay complete. */
  const save = (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();
    if (!isDraft)
      return form.handleSubmit(
        (v) => update.mutate(toPayload(v), { onSuccess: onSaved, onError }),
        () => toast.error(tf("fixErrors")),
      )();
    const draft = parseDraft(form);
    if (!draft) return toast.error(tf("fixErrors"));
    update.mutate(toPayload(draft), { onSuccess: onSaved, onError });
  };

  /** Draft → publish: needs the complete listing; saves pending changes first. */
  const publish = form.handleSubmit(
    async (v) => {
      try {
        await update.mutateAsync(toPayload(v));
        const res = await setStatus.mutateAsync({ id: campaign.id, status: "published" });
        toast.success(res.status === "published" ? tf("published") : tf("sentForReview"));
        router.replace("/brand");
      } catch (e) {
        onError(e);
      }
    },
    () => toast.error(tf("fixErrors")),
  );

  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <BackToBrand />
        <div>
          <Badge variant={STATUS_BADGE[campaign.status]}>{tm(`status.${campaign.status}`)}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t("title")}</h1>
        <p className="mt-1.5 text-pretty text-muted-foreground">
          {live ? t("subtitleLive") : isDraft ? t("subtitleDraft") : t("subtitle")}
        </p>

        <form noValidate onSubmit={save} className="mt-8 grid grid-cols-1">
          <Section title={tf("steps.what.title")}>
            <WhatFields form={form} />
          </Section>
          <Section title={tf("steps.who.title")}>
            <WhoFields form={form} />
          </Section>
          <Section title={tf("steps.pay.title")}>
            <PayFields form={form} />
          </Section>

          {isDraft && (
            <div className="flex flex-col-reverse gap-4 border-t border-border/70 pt-6 pb-6 sm:flex-row sm:items-center">
              <p className="text-sm text-pretty text-muted-foreground">
                {brand.review_status === "approved" ? t("publishNote") : tf("reviewNote")}
              </p>
              <Button
                type="button"
                size="lg"
                className="min-w-36 sm:ml-auto"
                disabled={busy}
                onClick={() => void publish()}
              >
                {tf("publish")}
              </Button>
            </div>
          )}

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
            <Button type="submit" disabled={busy}>
              {t("save")}
            </Button>
          </div>
        </form>
      </div>

      <Preview form={form} brand={brand} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-border/70 py-10 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      {children}
    </section>
  );
}

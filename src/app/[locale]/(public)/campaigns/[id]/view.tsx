"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaign } from "@/features/campaigns/hooks";

export function CampaignDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, error } = useCampaign(id);
  const t = useTranslations();

  if (isPending)
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <LoadingState>
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-8 h-48 rounded-3xl" />
        </LoadingState>
      </main>
    );
  if (error || !data) return <main className="p-10">{t("errors.notFound.campaign")}</main>;

  // TODO: real campaign UI + Apply button (useApply → show contact)
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <p className="text-neutral-500">{data.brand?.name}</p>
    </main>
  );
}

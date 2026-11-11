"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePublicCreator } from "@/features/creators/hooks";

export function CreatorProfileView() {
  const { handle } = useParams<{ handle: string }>();
  const { data, isPending, error } = usePublicCreator(handle);
  const t = useTranslations();

  if (isPending) return <main className="p-10 text-sm text-neutral-500">{t("common.loading")}</main>;
  if (error || !data) return <main className="p-10">{t("errors.notFound.creator")}</main>;

  // TODO: real profile UI (use emil-design-eng + break-ui skills)
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold">{data.display_name}</h1>
      <p className="text-neutral-500">@{data.handle} · {data.city}</p>
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { DynamicMarker } from "@/components/shared/dynamic-marker";
import { routing, toLocale } from "@/i18n/routing";
import { getPublicCampaign } from "@/server/services/campaigns";
import { CampaignDetailView } from "./view";

/** AGREED EXCEPTION: server metadata only (link previews). Body loads via /api. */
export async function generateMetadata({ params }: PageProps<"/[locale]/campaigns/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "meta" });
  const campaign = await getPublicCampaign(id).catch(() => null);
  // Draft, paused, rejected or missing → generic + noindex (no data leak).
  if (!campaign) return { title: t("notFound"), robots: { index: false } };

  // Published listings are always complete (DB check); the types allow null for drafts.
  const name = campaign.title ?? t("notFound");
  const title = campaign.brand ? `${name} · ${campaign.brand.name}` : name;
  const description = (campaign.description ?? "").slice(0, 160);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/campaigns/${id}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/campaigns/${id}`])),
    },
    openGraph: { title, description, images: campaign.brand?.logo_url ? [campaign.brand.logo_url] : [] },
  };
}

export default function Page() {
  // Suspense required: the view reads the URL (useParams) at request time.
  return (
    <>
      <DynamicMarker />
      <Suspense>
        <CampaignDetailView />
      </Suspense>
    </>
  );
}

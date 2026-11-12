import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
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

  const title = campaign.brand ? `${campaign.title} · ${campaign.brand.name}` : campaign.title;
  const description = campaign.description.slice(0, 160);
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
    <Suspense>
      <CampaignDetailView />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, toLocale } from "@/i18n/routing";
import { LegalPage } from "@/features/legal/components/legal-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "legal.privacy" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/privacy`])),
    },
  };
}

export default function Page() {
  return <LegalPage doc="privacy" />;
}

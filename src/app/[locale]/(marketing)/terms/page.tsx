import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, toLocale } from "@/i18n/routing";
import { LegalPage } from "@/features/legal/components/legal-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "legal.terms" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/terms`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/terms`])),
    },
  };
}

export default function Page() {
  return <LegalPage doc="terms" />;
}

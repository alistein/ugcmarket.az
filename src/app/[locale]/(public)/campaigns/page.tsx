import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { routing, toLocale } from "@/i18n/routing";
import { BoardView } from "./view";

/** Static metadata only (no data): the board's link preview and search listing (D11). */
export async function generateMetadata({ params }: PageProps<"/[locale]/campaigns">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "board" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/campaigns`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/campaigns`])),
    },
    openGraph: { title, description },
  };
}

export default function Page() {
  // Suspense required: the view reads filters from the URL (useSearchParams).
  return (
    <Suspense>
      <BoardView />
    </Suspense>
  );
}

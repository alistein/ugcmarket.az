import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { DynamicMarker } from "@/components/shared/dynamic-marker";
import { routing, toLocale } from "@/i18n/routing";
import { getPublicCreator } from "@/server/services/creators";
import { CreatorProfileView } from "./view";

/**
 * AGREED EXCEPTION (wiki: project-structure): only metadata is rendered on the server,
 * for link previews on Instagram/Telegram. The page body loads via /api like everywhere else.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/creator/[handle]">): Promise<Metadata> {
  const { locale, handle } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "meta" });
  const creator = await getPublicCreator(handle).catch(() => null);
  if (!creator) return { title: t("notFound"), robots: { index: false } };

  const title = `${creator.display_name} (@${creator.handle})`;
  const tt = await getTranslations({ locale: toLocale(locale), namespace: "taxonomy.cities" });
  const city = tt.has(creator.city as never) ? tt(creator.city as never) : creator.city;
  const description = creator.bio ?? t("creatorDescription", { city });
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/creator/${creator.handle}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/creator/${creator.handle}`])),
    },
    openGraph: {
      title,
      description,
      type: "profile",
      images: creator.avatar_url ? [creator.avatar_url] : [],
    },
  };
}

export default function Page() {
  // Suspense required: the view reads the URL (useParams) at request time.
  return (
    <>
      <DynamicMarker />
      <Suspense>
        <CreatorProfileView />
      </Suspense>
    </>
  );
}

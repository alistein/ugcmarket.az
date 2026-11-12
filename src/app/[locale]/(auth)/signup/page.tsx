import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignupView } from "@/features/auth/components/signup-view";
import { toLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "pages" });
  return { title: t("signup") };
}

// useSearchParams inside → must sit under Suspense (Next 16 + Cache Components).
export default function Page() {
  return (
    <Suspense>
      <SignupView />
    </Suspense>
  );
}

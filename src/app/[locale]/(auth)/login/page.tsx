import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LoginView } from "@/features/auth/components/login-view";
import { toLocale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "pages" });
  return { title: t("login") };
}

// useSearchParams inside → must sit under Suspense (Next 16 + Cache Components).
export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}

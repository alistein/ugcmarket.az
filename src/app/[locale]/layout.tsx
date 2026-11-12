import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/shared/providers";
import { routing, toLocale } from "@/i18n/routing";
import { env } from "@/lib/env";
import "../globals.css";

// Self-hosted Geist (no Google Fonts request). Full glyph set: Azerbaijani (ə, ğ, ı, ş) + Cyrillic.

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// mobile-native: paint under the notch (content is padded back with env(safe-area-inset-*)),
// keyboard resizes the layout on Android, status bar matches the page top. The site is light-only
// for now (no theme toggle), so one theme-color; split per scheme once dark mode ships.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#fdfbf9",
  colorScheme: "light",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "meta" });
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t("title"), template: `%s · UGCMarket` },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

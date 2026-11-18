"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { LanguageMenu } from "@/components/shared/language-menu";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";

const SECTIONS = {
  privacy: ["collect", "use", "contacts", "stats", "processors", "cookies", "retention", "contact"],
  terms: ["about", "account", "deals", "rules", "content", "liability", "changes", "contact"],
} as const;

/** Privacy Policy / Terms of Use. Text lives in messages (legal.*); public and indexable. */
export function LegalPage({ doc }: { doc: keyof typeof SECTIONS }) {
  const t = useTranslations("legal");
  const tc = useTranslations("common");
  const email = t("contactEmail");
  const mail = (chunks: React.ReactNode) => (
    <a href={`mailto:${email}`} className="font-medium text-primary underline-offset-4 hover:underline">
      {chunks}
    </a>
  );
  // Section keys are checked by SECTIONS + az.json; the template literal is too wide for next-intl's types.
  type Key = Parameters<typeof t>[0];

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-5">
        <Link href="/" aria-label="UGCMarket">
          <Logo className="text-base" />
        </Link>
        <LanguageMenu />
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 rounded-full py-1 pr-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          {tc("back")}
        </Link>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-balance">{t(`${doc}.title`)}</h1>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">{t("updated")}</p>
        <p className="mt-6 text-pretty">{t(`${doc}.intro`)}</p>
        {SECTIONS[doc].map((key) => (
          <section key={key} className="mt-8">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">{t(`${doc}.${key}.title` as Key)}</h2>
            <p className="mt-2 leading-relaxed text-pretty text-foreground/85">
              {t.rich(`${doc}.${key}.body` as Key, { email, mail })}
            </p>
          </section>
        ))}
      </main>
    </div>
  );
}

"use client";

import { LanguageMenu } from "@/components/shared/language-menu";
import { Link } from "@/i18n/navigation";

// Client component on purpose: next-intl's server Link reads the request locale (runtime data),
// which would block prerendering under Cache Components.
export function AuthHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3">
      <Link href="/" className="font-heading text-lg font-semibold tracking-[-0.03em]">
        ugc<span className="text-primary">market</span>
      </Link>
      <div className="ml-auto">
        <LanguageMenu />
      </div>
    </header>
  );
}

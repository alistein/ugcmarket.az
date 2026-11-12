"use client";

import { LanguageMenu } from "@/components/shared/language-menu";
import { Link } from "@/i18n/navigation";

// Client component on purpose: next-intl's server Link reads the request locale (runtime data),
// which would block prerendering under Cache Components.
export function AuthHeader() {
  return (
    <header className="flex w-full items-center gap-2 px-4 py-3 sm:px-6 sm:py-5">
      <Link href="/" className="font-heading text-xl font-semibold tracking-[-0.03em]">
        ugc<span className="text-primary">market</span>
      </Link>
      <div className="ml-auto">
        <LanguageMenu />
      </div>
    </header>
  );
}

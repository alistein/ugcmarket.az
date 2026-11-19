"use client";

import { ArrowRight01Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = {
  eyebrow: string;
  eyebrowVariant?: "brand" | "sun" | "mint" | "sky" | "rose";
  title: string;
  body: string;
  steps: { title: string; subtitle: string }[];
  /** Privacy or rule note under the steps (plain text with a lock icon). */
  note: string;
  cta: { label: string; href: string };
  /** Decorative preview of the finished result. */
  visual: React.ReactNode;
};

/**
 * First-run screen of a role home (creator /me, brand /brand) before the profile exists:
 * numbered steps, one CTA and a preview of the result. Plain background, no motion (seen once).
 */
export function SetupIntro({
  eyebrow,
  eyebrowVariant = "mint",
  title,
  body,
  steps,
  note,
  cta,
  visual,
}: Props) {
  return (
    <div className="grid items-center gap-12 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:py-10">
      <div className="max-w-xl">
        <Badge variant={eyebrowVariant}>{eyebrow}</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">{title}</h1>
        <p className="mt-3 text-lg text-pretty text-muted-foreground">{body}</p>

        <ol className="mt-8 grid gap-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background tabular-nums">
                {i + 1}
              </span>
              <span className="grid gap-0.5 pt-1">
                <span className="font-medium">{s.title}</span>
                <span className="text-sm text-muted-foreground">{s.subtitle}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-8 flex items-start gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {note}
        </p>

        <Button
          size="lg"
          className="mt-8 h-12 px-6 text-base"
          nativeButton={false}
          render={<Link href={cta.href} />}
        >
          {cta.label}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </div>

      {visual}
    </div>
  );
}

"use client";

import { ArrowDown01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CREATOR_SKILLS,
  ENABLED_PRICE_FORMATS,
  EXCLUSIVE_LIFESTYLE,
  LIFESTYLE_GROUPS,
  type LifestyleGroup,
  type LifestyleTag,
  SHOOT_OPTIONS,
} from "@/schemas";
import type { CreatorFormValues } from "../form";
import { ChipGroup } from "./form-bits";

type Form = UseFormReturn<CreatorFormValues>;

/**
 * "Niyə soruşuruq?": a quiet link that opens a short, plain explanation of why we ask for
 * personal details and who sees them. `topic` picks the text.
 */
export function WhyWeAsk({ topic }: { topic: "about" | "lifestyle" }) {
  const t = useTranslations("creator.why");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
      >
        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
        {t("link")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription className="text-pretty">{t(`${topic}Body`)}</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 text-sm text-pretty text-muted-foreground">
            <li>{t("point1")}</li>
            <li>{t("point2")}</li>
          </ul>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>{t("ok")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Həyat tərzi və maraqlar ─────────────────────────────────────────────────
/** Who the creator is: tags in closed groups that show their count. Nothing is required. */
export function LifestyleFields({ form }: { form: Form }) {
  const t = useTranslations("creator.lifestyle");
  const tt = useTranslations("taxonomy");
  const { control } = form;
  const value = useWatch({ control, name: "lifestyle_tags" }) ?? [];
  const [open, setOpen] = useState<LifestyleGroup | null>(null);

  return (
    <Controller
      control={control}
      name="lifestyle_tags"
      render={({ field }) => (
        <div className="grid gap-4">
          <WhyWeAsk topic="lifestyle" />
          <div className="grid">
            {(Object.keys(LIFESTYLE_GROUPS) as LifestyleGroup[]).map((g) => {
              const options = LIFESTYLE_GROUPS[g] as readonly LifestyleTag[];
              const picked = options.filter((o) => value.includes(o));
              const isOpen = open === g;
              return (
                <div key={g} className="border-b border-border/70 last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : g)}
                    className="flex w-full items-center gap-3 py-3.5 text-left outline-none focus-visible:underline"
                  >
                    <span className="flex-1 font-medium">{tt(`lifestyleGroups.${g}`)}</span>
                    {picked.length > 0 && (
                      <span className="text-sm text-muted-foreground tabular-nums">{picked.length}</span>
                    )}
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                      className={cn("size-4 text-muted-foreground", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-4">
                      <ChipGroup
                        options={options}
                        value={picked}
                        onChange={(next) => {
                          const added = next.find((o) => !picked.includes(o));
                          // Subay and Ailəvi exclude each other: picking one drops the other.
                          const drop = EXCLUSIVE_LIFESTYLE.flatMap((pair) =>
                            added && (pair as readonly string[]).includes(added)
                              ? pair.filter((p) => p !== added)
                              : [],
                          );
                          field.onChange([
                            ...value.filter((v) => !options.includes(v) && !drop.includes(v as never)),
                            ...next.filter((v) => !drop.includes(v as never)),
                          ]);
                        }}
                        label={(o) => tt(`lifestyle.${o}`)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">{t("count", { count: value.length })}</p>
        </div>
      )}
    />
  );
}

// ── Qiymətlər və şərtlər ────────────────────────────────────────────────────
/** How the creator works: a minimum ("from") price per format, where they film, what they do themselves. */
export function TermsFields({ form }: { form: Form }) {
  const t = useTranslations("creator.terms");
  const tt = useTranslations("taxonomy");
  const { register, control, formState } = form;
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="grid gap-0.5">
          <p className="text-sm font-medium">{t("pricesTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("pricesHint")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ENABLED_PRICE_FORMATS.map((f) => (
            <Field key={f} label={tt(`formats.${f}`)} error={formState.errors.prices?.[f]}>
              {(a) => (
                <div className="relative">
                  <Input
                    {...a}
                    {...register(`prices.${f}`)}
                    inputMode="decimal"
                    placeholder={t("pricePh")}
                    className="pr-20 tabular-nums"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                    {t("aznFrom")}
                  </span>
                </div>
              )}
            </Field>
          ))}
        </div>
      </div>

      <Field label={t("shootTitle")} hint={t("shootHint")}>
        {(a) => (
          <Controller
            control={control}
            name="shoot_options"
            render={({ field }) => (
              <ChipGroup
                options={SHOOT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                label={(o) => tt(`shootOptions.${o}`)}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      <Field label={t("skillsTitle")} hint={t("skillsHint")}>
        {(a) => (
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <ChipGroup
                options={CREATOR_SKILLS}
                value={field.value}
                onChange={field.onChange}
                label={(o) => tt(`skills.${o}`)}
                describedBy={a["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
    </div>
  );
}

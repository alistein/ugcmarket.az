"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
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
import { ENABLED_PRICE_FORMATS, SHOOT_OPTIONS } from "@/schemas";
import type { CreatorFormValues } from "../form";
import { ChipGroup } from "./form-bits";

type Form = UseFormReturn<CreatorFormValues>;

/**
 * "Niyə soruşuruq?": a quiet link that opens a short, plain explanation of why we ask for
 * personal details and who sees them. `topic` picks the text.
 */
export function WhyWeAsk({ topic }: { topic: "about" }) {
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

// ── Qiymətlər və şərtlər ────────────────────────────────────────────────────
/** How the creator works: a minimum ("from") price per format and where they film. */
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
    </div>
  );
}

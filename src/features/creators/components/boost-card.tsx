"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  GridViewIcon,
  InstagramIcon,
  UserCircleIcon,
  UserIcon,
  Video01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import {
  aboutStatus,
  type CreatorFormValues,
  CreatorSetupForm,
  creatorToForm,
  PROFILE_SECTIONS,
  type ProfileSection,
  profileCompleteness,
  toPayload,
} from "../form";
import { type MyCreator, useUpdateCreator } from "../hooks";
import { LifestyleFields, TermsFields } from "./enhancer-fields";
import { type AboutField, AboutFields } from "./profile-sections";

const ICON: Record<ProfileSection, typeof UserIcon> = {
  about: UserCircleIcon,
  content: GridViewIcon,
  socials: InstagramIcon,
  lifestyle: UserIcon,
  portfolio: Video01Icon,
  terms: Wallet01Icon,
};

/** Enhancer first (what's left to do), then any onboarding section with a gap (photo, bio). */
const ORDER: ProfileSection[] = ["portfolio", "lifestyle", "terms", "about", "content", "socials"];

/**
 * "Profilinizi gücləndirin": the total, a bar, and one row per unfinished section with its own
 * percent. A row opens just that section; finished sections leave the list (still editable on
 * the edit page). At 100% the card disappears.
 */
export function BoostCard({
  creator: c,
  onPortfolio,
  onOpen,
}: {
  creator: MyCreator;
  onPortfolio: () => void;
  onOpen: (s: SheetSection) => void;
}) {
  const t = useTranslations("creator.boost");
  const ts = useTranslations("creator.sections");
  const tf = useTranslations("creator.form");
  const { sections, total, done } = profileCompleteness(c);
  const missingAbout = aboutStatus(c)
    .filter((x) => !x.done)
    .map((x) => tf(FIELD_LABEL[x.field]));

  // A complete profile needs no card at all.
  if (total === 100) return null;

  const todo = ORDER.filter((s) => sections[s] < 100);

  return (
    <section className="rounded-3xl bg-card p-4 shadow-(--shadow-soft) sm:p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold tracking-[-0.02em]">{t("title")}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{t("subtitle")}</p>
        </div>
        <p className="text-xl font-semibold tracking-[-0.03em] text-primary tabular-nums">{total}%</p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("title")}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${total}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
        {t("done", { done, total: PROFILE_SECTIONS.length })}
      </p>

      <ul className="mt-3 grid border-t border-border/70">
        {todo.map((s) => {
          const inner = (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                <HugeiconsIcon icon={ICON[s]} strokeWidth={2} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{ts(`${s}.title`)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s === "about" ? ts("about.missing", { fields: missingAbout.join(", ") }) : ts(`${s}.hint`)}
                </span>
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">{sections[s]}%</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
            </>
          );
          const cls =
            "flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:bg-muted/60 rounded-xl";
          return (
            <li key={s} className="border-b border-border/70 last:border-b-0">
              {s === "portfolio" ? (
                <button type="button" className={cls} onClick={onPortfolio}>
                  {inner}
                </button>
              ) : s === "about" || s === "lifestyle" || s === "terms" ? (
                <button type="button" className={cls} onClick={() => onOpen(s)}>
                  {inner}
                </button>
              ) : (
                <Link href={`/me/profile#${s}`} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Sections that open in a panel from the card (portfolio scrolls to its own section instead). */
export type SheetSection = "about" | "lifestyle" | "terms";

/** Form label key for each "Özünüz haqqında" field. */
const FIELD_LABEL: Record<
  AboutField,
  "avatar" | "displayName" | "handle" | "birthYear" | "gender" | "city" | "bio"
> = {
  avatar_url: "avatar",
  display_name: "displayName",
  handle: "handle",
  birth_year: "birthYear",
  gender: "gender",
  city: "city",
  bio: "bio",
};

/** Fields the lifestyle and terms panels own and save (nothing else is sent). */
const SHEET_FIELDS = {
  lifestyle: ["lifestyle_tags"],
  terms: ["prices", "shoot_options", "skills"],
} as const;

/**
 * One section on its own: a bottom sheet on phones, a side sheet on wider screens.
 * "about" shows a done / missing list of its fields and asks only for the missing ones.
 */
export function SectionSheet({
  creator,
  section,
  onClose,
}: {
  creator: MyCreator;
  section: SheetSection | null;
  onClose: () => void;
}) {
  const ts = useTranslations("creator.sections");
  const tf = useTranslations("creator.form");
  const t = useTranslations("creator.boost");
  const status = aboutStatus(creator);
  const missing = status.filter((x) => !x.done).map((x) => x.field);
  const te = useTranslations();
  const desktop = useMediaQuery("(min-width: 640px)");
  const update = useUpdateCreator();
  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(CreatorSetupForm),
    values: creatorToForm(creator),
  });

  const save = async () => {
    if (!section) return;
    const fields = section === "about" ? missing : SHEET_FIELDS[section];
    if (!(await form.trigger(fields as unknown as (keyof CreatorFormValues)[], { shouldFocus: true })))
      return;
    const payload = toPayload(form.getValues());
    const partial =
      section === "about"
        ? Object.fromEntries(missing.map((f) => [f, payload[f]]))
        : section === "lifestyle"
          ? { lifestyle_tags: payload.lifestyle_tags }
          : { prices: payload.prices, shoot_options: payload.shoot_options, skills: payload.skills };
    update.mutate(partial, {
      onSuccess: () => {
        toast.success(t("saved"));
        onClose();
      },
      onError: (e) => {
        const key = e instanceof ApiClientError ? e.message : "errors.unknown";
        toast.error(te.has(key as never) ? te(key as never) : te("errors.unknown"));
      },
    });
  };

  return (
    <Sheet open={!!section} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        className={cn("data-[side=bottom]:max-h-[calc(100dvh-0.5rem)] sm:max-w-md!")}
      >
        {section && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">{ts(`${section}.title`)}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {section === "about" ? ts("about.panelHint") : ts(`${section}.hint`)}
              </p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6">
              {section === "about" ? (
                <div className="grid gap-6">
                  <ul className="grid gap-1.5 text-sm" aria-label={ts("about.title")}>
                    {status.map((x) => (
                      <li key={x.field} className="flex items-center gap-2">
                        {x.done ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            strokeWidth={2}
                            className="size-4 text-mint-ink"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="size-4 rounded-full border-[1.5px] border-dashed border-muted-foreground/60"
                          />
                        )}
                        <span className={cn(x.done ? "text-muted-foreground" : "font-medium")}>
                          {tf(FIELD_LABEL[x.field])}
                        </span>
                        <span className="sr-only">{x.done ? t("fieldDone") : t("fieldMissing")}</span>
                      </li>
                    ))}
                  </ul>
                  <AboutFields form={form} currentHandle={creator.handle} only={missing} />
                </div>
              ) : section === "lifestyle" ? (
                <LifestyleFields form={form} />
              ) : (
                <TermsFields form={form} />
              )}
            </div>
            <SheetFooter>
              <Button size="lg" disabled={update.isPending} onClick={save}>
                {t("save")}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

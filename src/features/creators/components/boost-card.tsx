"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight01Icon,
  Cancel01Icon,
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
import { useEffect, useState } from "react";
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

/** The three enhancer sections, always listed in this order; finished ones stay with a green 100%. */
const ENHANCER_ORDER: ProfileSection[] = ["lifestyle", "terms", "portfolio"];
/** Onboarding sections are listed only while something in them is missing (photo, bio). */
const ONBOARDING_ORDER: ProfileSection[] = ["about", "content", "socials"];

/**
 * "Profilinizi gücləndirin": the total, a bar, and one row per unfinished section with its own
 * percent. A row opens just that section; finished enhancer sections stay with a green 100% (still editable on
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

  // The finishing moment: the total crossed into 100% while this card was on screen (never on a
  // page load of an already complete profile). Derived during render from the last total seen.
  const [lastTotal, setLastTotal] = useState(total);
  const [celebrating, setCelebrating] = useState(false);
  if (total !== lastTotal) {
    setLastTotal(total);
    if (lastTotal < 100 && total === 100) setCelebrating(true);
  }
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

  if (total === 100 && !celebrating) return <CompleteLine creatorId={c.id} />;

  const todo = [...ENHANCER_ORDER, ...ONBOARDING_ORDER.filter((s) => sections[s] < 100)];

  return (
    <section className="rounded-3xl bg-card p-4 shadow-(--shadow-soft) sm:p-5">
      {celebrating && <Confetti />}
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold tracking-[-0.02em]">
            {celebrating ? t("completeTitle") : t("title")}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {celebrating ? t("completeBody") : t("subtitle")}
          </p>
        </div>
        <p
          className={cn(
            "relative text-xl font-semibold tracking-[-0.03em] tabular-nums [transition:color_300ms_ease]",
            celebrating ? "text-mint-ink" : "text-primary",
          )}
        >
          {total}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("title")}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        {/* scale, not width: the fill glides when a section is saved (transform only). */}
        <div
          className={cn(
            "h-full origin-left rounded-full [transition:scale_600ms_var(--ease-out),background-color_300ms_ease]",
            celebrating ? "bg-mint-ink" : "bg-primary",
          )}
          style={{ scale: `${total / 100} 1` }}
        />
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
              <span
                className={cn(
                  "text-sm tabular-nums",
                  sections[s] === 100 ? "font-medium text-mint-ink" : "text-muted-foreground",
                )}
              >
                {sections[s]}%
              </span>
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

const CELEBRATION_MS = 4000;
const CONFETTI_COLORS = [
  "var(--primary)",
  "var(--sun-ink)",
  "var(--mint-ink)",
  "var(--sky-ink)",
  "var(--rose-ink)",
];

/**
 * Full-screen confetti, once, when the profile is completed (a rare moment, so delight is earned).
 * Two cannons in the bottom corners shoot up and inward, then pieces drift down and fade, about
 * 2.5 seconds, nothing loops. A fixed layer on <body> that never takes clicks, removed when done.
 * Skipped for reduced motion. WAAPI on plain elements: no React re-render per frame.
 */
function Confetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "60",
      overflow: "hidden",
    });
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const animations = Array.from({ length: 140 }, (_, i) => {
      const left = i % 2 === 0;
      const el = document.createElement("span");
      const size = 6 + Math.random() * 6;
      Object.assign(el.style, {
        position: "absolute",
        left: left ? "0px" : `${w}px`,
        top: `${h}px`,
        width: `${size}px`,
        height: `${size * (Math.random() > 0.5 ? 0.6 : 1.6)}px`,
        borderRadius: Math.random() > 0.7 ? "50%" : "2px",
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      });
      layer.appendChild(el);
      // Up and toward the middle, peaking somewhere in the top half, then falling past it.
      const dx = (left ? 1 : -1) * (w * (0.15 + Math.random() * 0.55));
      const peak = -h * (0.45 + Math.random() * 0.45);
      const fall = peak + h * (0.35 + Math.random() * 0.4);
      const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
      return el.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${dx * 0.8}px, ${peak}px) rotate(${spin * 0.4}deg)`,
            opacity: 1,
            offset: 0.35,
          },
          { transform: `translate(${dx}px, ${fall}px) rotate(${spin}deg)`, opacity: 0 },
        ],
        {
          duration: 2000 + Math.random() * 900,
          delay: Math.random() * 180,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          fill: "forwards",
        },
      );
    });
    let cancelled = false;
    Promise.allSettled(animations.map((a) => a.finished)).then(() => !cancelled && layer.remove());
    return () => {
      cancelled = true;
      layer.remove();
    };
  }, []);
  return null;
}

const dismissKey = (id: string) => `ugc:profile-complete-seen:${id}`;

/** After the celebration: one quiet line until the creator closes it, then nothing, ever. */
function CompleteLine({ creatorId }: { creatorId: string }) {
  const t = useTranslations("creator.boost");
  const [closed, setClosed] = useState(() => {
    try {
      return window.localStorage.getItem(dismissKey(creatorId)) === "1";
    } catch {
      return false;
    }
  });
  if (closed) return null;
  return (
    <p className="flex items-center gap-2 text-sm [transition:opacity_200ms_ease] starting:opacity-0">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-5 shrink-0 text-mint-ink" />
      <span className="flex-1 text-pretty">
        <span className="font-medium">{t("completeTitlePlain")}</span>{" "}
        <span className="text-muted-foreground">{t("completeBody")}</span>
      </span>
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => {
          setClosed(true);
          try {
            window.localStorage.setItem(dismissKey(creatorId), "1");
          } catch {
            // Storage blocked: it just shows again next time.
          }
        }}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none [transition:scale_160ms_var(--ease-out),background-color_150ms_ease] hover:bg-muted hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/25 active:scale-[0.97]"
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
      </button>
    </p>
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
  terms: ["prices", "shoot_options"],
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
          : { prices: payload.prices, shoot_options: payload.shoot_options };
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

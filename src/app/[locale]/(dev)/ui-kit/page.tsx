"use client";

import { notFound } from "next/navigation";
import { UiKitShowcase } from "./showcase";

/**
 * Internal UI kit showcase. Available in dev; in production only when NEXT_PUBLIC_SHOW_UI_KIT=1
 * (e.g. Vercel preview). Copy is intentionally English-only and not translated — this is not a user-facing page.
 */
export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SHOW_UI_KIT !== "1") notFound();
  return <UiKitShowcase />;
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect } from "react";
import { meKeys } from "@/features/me/hooks";
import { isProtectedPath, splitLocale } from "@/lib/auth-routes";
import { createClient } from "@/lib/supabase/client";
import { authCallInFlight } from "../identity";

/**
 * Watches who is signed in. A different user (or sign-out) coming from another tab is a full page
 * load: Next keeps visited pages mounted and caches routes, so nothing short of a reload drops the
 * previous user's screens. Same user (tab focus, token refresh) does nothing. Changes started in
 * this tab are navigated by their caller (useAfterAuth / useSignOut).
 */
export function AuthSync() {
  const qc = useQueryClient();
  useEffect(() => {
    // undefined = not known yet (before INITIAL_SESSION).
    let userId: string | null | undefined;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const nextId = session?.user.id ?? null;
      const prevId = userId;
      userId = nextId;

      if (prevId === undefined || prevId === nextId) {
        if (nextId && prevId === undefined) posthog.identify(nextId);
        // Email or password changed for the same user.
        if (event === "USER_UPDATED") void qc.invalidateQueries({ queryKey: meKeys.all });
        return;
      }

      if (nextId) posthog.identify(nextId);
      else posthog.reset();
      if (authCallInFlight()) return;

      const { locale, path } = splitLocale(window.location.pathname);
      if (!nextId && locale && isProtectedPath(path)) window.location.replace(`/${locale}/login`);
      else window.location.reload();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return null;
}

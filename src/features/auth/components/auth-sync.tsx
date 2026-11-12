"use client";

import { useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { useEffect } from "react";
import { meKeys } from "@/features/me/hooks";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the `me` cache in step with Supabase Auth (sign-in/out in this tab, token refresh,
 * password change). On sign-out every cached query is dropped so the next user sees nothing stale.
 */
export function AuthSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        qc.clear();
        posthog.reset();
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void qc.invalidateQueries({ queryKey: meKeys.all });
        if (session?.user.id) posthog.identify(session.user.id);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return null;
}

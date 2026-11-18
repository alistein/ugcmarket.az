"use client";

import { useLocale } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { type AuthErrorKey, errorKeyOf } from "../errors";
import { useAfterAuth, useSignInWithGoogleIdToken } from "../hooks";
import { GoogleRedirectButton } from "./auth-ui";

/**
 * "Continue with Google". With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, it uses Google Identity Services
 * on our own page: Google returns an ID token to ugcmarket.az and Supabase verifies it
 * (signInWithIdToken), so the user never sees the supabase.co host. Also offers One Tap.
 * Without the client ID, or if Google's script can't load (ad blockers), it falls back to the
 * Supabase redirect flow.
 */
export function GoogleButton({
  next,
  onError,
  context,
}: {
  next: string;
  onError: (key: AuthErrorKey) => void;
  context: "signin" | "signup";
}) {
  if (!env.googleClientId) return <GoogleRedirectButton next={next} onError={onError} />;
  return <GoogleIdentityButton next={next} onError={onError} context={context} />;
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
/** Google renders the button at most 400px wide. */
const GSI_MAX_WIDTH = 400;

/** Raw nonce goes to Supabase, its SHA-256 hex goes to Google (Supabase compares the two). */
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

function GoogleIdentityButton({
  next,
  onError,
  context,
}: {
  next: string;
  onError: (key: AuthErrorKey) => void;
  context: "signin" | "signup";
}) {
  const locale = useLocale();
  const afterAuth = useAfterAuth(next);
  const signIn = useSignInWithGoogleIdToken();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const boxRef = useRef<HTMLDivElement>(null);

  // Google's callback is registered once per init; read the latest handlers through a ref.
  const latest = useRef({ afterAuth, onError, mutate: signIn.mutate });
  useEffect(() => {
    latest.current = { afterAuth, onError, mutate: signIn.mutate };
  });

  useEffect(() => {
    if (status !== "ready") return;
    const box = boxRef.current;
    const gsi = window.google?.accounts.id;
    if (!box || !gsi) return;

    let cancelled = false;
    let observer: ResizeObserver | undefined;

    void makeNonce().then(({ raw, hashed }) => {
      if (cancelled) return;
      gsi.initialize({
        client_id: env.googleClientId,
        nonce: hashed,
        context,
        ux_mode: "popup",
        itp_support: true,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: true,
        callback: ({ credential }) => {
          const { mutate, afterAuth: done, onError: fail } = latest.current;
          mutate(
            { token: credential, nonce: raw },
            { onSuccess: () => void done(), onError: (e) => fail(errorKeyOf(e)) },
          );
        },
      });

      let width = 0;
      const render = () => {
        const w = Math.min(GSI_MAX_WIDTH, Math.round(box.clientWidth));
        if (!w || w === width) return;
        width = w;
        gsi.renderButton(box, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          width: w,
          locale,
        });
      };
      render();
      observer = new ResizeObserver(render);
      observer.observe(box);

      // One Tap: a dismissed or unavailable prompt is silent by design.
      gsi.prompt();
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      gsi.cancel();
    };
  }, [status, context, locale]);

  if (status === "failed") return <GoogleRedirectButton next={next} onError={onError} />;

  const showOwn = status === "loading" || signIn.isPending;
  return (
    <>
      <Script
        id="google-gsi"
        src={GSI_SRC}
        strategy="afterInteractive"
        onReady={() => setStatus("ready")}
        onError={() => setStatus("failed")}
      />
      {/* Same height as the other auth actions, so nothing jumps when Google's button arrives. */}
      <div className="flex h-11 items-center justify-center">
        {showOwn && <GoogleRedirectButton next={next} onError={onError} busy={signIn.isPending} />}
        <div ref={boxRef} className={cn("flex w-full justify-center", showOwn && "hidden")} />
      </div>
    </>
  );
}

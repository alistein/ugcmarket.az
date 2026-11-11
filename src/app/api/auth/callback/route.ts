import { NextResponse } from "next/server";
import { createUserClient } from "@/server/db/supabase";

/** OAuth (Google) and email-link callback: exchanges the code for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/az/onboarding";
  if (code) {
    const supabase = await createUserClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", url.origin));
  }
  return NextResponse.redirect(new URL("/az/login?error=auth", url.origin));
}

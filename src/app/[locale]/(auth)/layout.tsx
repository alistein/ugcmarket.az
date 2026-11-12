import type { Metadata } from "next";
import { AuthHeader } from "@/features/auth/components/auth-header";

// Auth screens are never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AuthHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pb-16">
        {children}
      </main>
    </div>
  );
}

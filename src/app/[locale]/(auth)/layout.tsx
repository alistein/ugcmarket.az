import type { Metadata } from "next";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { AuthShowcase } from "@/features/auth/components/auth-showcase";

// Auth screens are never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Split screen: form on the left, marketplace collage on the right (lg+). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col">
        <AuthHeader />
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
          {children}
        </main>
      </div>
      <div className="hidden p-4 lg:block xl:p-5">
        <div className="sticky top-5 h-[calc(100dvh-2.5rem)]">
          <AuthShowcase />
        </div>
      </div>
    </div>
  );
}

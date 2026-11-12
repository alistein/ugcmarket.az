import type { Metadata } from "next";

// Internal tools (e.g. /ui-kit). Never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}

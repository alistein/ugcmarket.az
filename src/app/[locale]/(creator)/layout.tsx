"use client";

import { RoleGate } from "@/components/shared/role-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="creator">{children}</RoleGate>;
}

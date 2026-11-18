"use client";

import { AppShell } from "@/components/shared/app-shell";
import { RoleGate } from "@/components/shared/role-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="creator" fallback={<AppShell>{null}</AppShell>}>
      <AppShell>{children}</AppShell>
    </RoleGate>
  );
}

"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { AccountList } from "@/components/admin/account-list";

export default function ActiveAgentsPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Active Agents" subtitle="Approved agent accounts">
      <AccountList partyType="AGENT" />
    </ProtectedShell>
  );
}

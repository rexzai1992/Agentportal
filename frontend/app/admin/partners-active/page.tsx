"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { AccountList } from "@/components/admin/account-list";

export default function ActivePartnersPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Active Partners" subtitle="Approved partner accounts">
      <AccountList partyType="PARTNER" />
    </ProtectedShell>
  );
}

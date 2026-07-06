"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { RegistrationQueue } from "@/components/admin/registration-queue";

export default function PartnerRequestsPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Partner Request" subtitle="Review partner registrations">
      <RegistrationQueue partyType="PARTNER" />
    </ProtectedShell>
  );
}

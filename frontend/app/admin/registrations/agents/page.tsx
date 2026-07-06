"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { RegistrationQueue } from "@/components/admin/registration-queue";

export default function AgentRequestsPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Agent Request" subtitle="Review agent registrations">
      <RegistrationQueue partyType="AGENT" />
    </ProtectedShell>
  );
}

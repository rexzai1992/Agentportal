"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfflinePaymentList } from "@/components/admin/offline-payment-list";

export default function AdminOfflineApprovalPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Offline Payment Approval" subtitle="All offline payments">
      <OfflinePaymentList basePath="/admin/offline-payments" />
    </ProtectedShell>
  );
}

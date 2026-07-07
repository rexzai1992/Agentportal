"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfflinePaymentList } from "@/components/admin/offline-payment-list";

export default function AdminPendingPaymentsPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Pending Payment Approval" subtitle="Approve offline payments">
      <OfflinePaymentList status="PENDING_APPROVAL" basePath="/admin/offline-payments" canApprove />
    </ProtectedShell>
  );
}

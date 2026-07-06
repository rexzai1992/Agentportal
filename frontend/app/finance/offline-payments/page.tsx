"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfflinePaymentList } from "@/components/admin/offline-payment-list";

export default function FinanceOfflinePaymentsPage() {
  return (
    <ProtectedShell roles={["FINANCE", "ADMIN"]} title="Offline Payments" subtitle="Mark payments as paid">
      <OfflinePaymentList basePath="/finance/offline-payments" />
    </ProtectedShell>
  );
}

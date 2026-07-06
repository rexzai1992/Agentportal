"use client";

import { useParams } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfflinePaymentReview } from "@/components/admin/offline-payment-review";

export default function FinancePaymentReviewPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedShell roles={["FINANCE", "ADMIN"]} title="Review Offline Payment" subtitle="Finance verification">
      <OfflinePaymentReview id={params.id} role="FINANCE" />
    </ProtectedShell>
  );
}

"use client";

import { useParams } from "next/navigation";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { OfflinePaymentReview } from "@/components/admin/offline-payment-review";

export default function AdminPaymentReviewPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedShell roles={["ADMIN"]} title="Review Offline Payment" subtitle="Admin approval">
      <OfflinePaymentReview id={params.id} role="ADMIN" />
    </ProtectedShell>
  );
}

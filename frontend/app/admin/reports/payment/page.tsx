"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";

export default function PaymentReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Payment" subtitle="Payment transactions">
      <ReportShell
        endpoint="/api/reports/payment"
        fileName="payment-report.xlsx"
        showUserFilters
        columns={[
          { key: "username", label: "Username" },
          { key: "companyName", label: "Company Name" },
          { key: "reference", label: "Reference No." },
          { key: "paymentDate", label: "Payment Date", type: "datetime" },
          { key: "paymentName", label: "Payment Name" },
          { key: "paymentAmount", label: "Payment Amount (RM)", type: "currency" },
          { key: "status", label: "Status" }
        ]}
      />
    </ProtectedShell>
  );
}

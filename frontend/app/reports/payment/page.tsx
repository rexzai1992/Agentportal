"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";

export default function AgentPaymentReportPage() {
  return (
    <ProtectedShell roles={["AGENT"]} title="Payment Report" subtitle="Your payments">
      <ReportShell
        endpoint="/api/reports/payment"
        fileName="payment-report.xlsx"
        columns={[
          { key: "reference", label: "Reference No" },
          { key: "paymentDate", label: "Payment Date", type: "datetime" },
          { key: "paymentName", label: "Payment Name" },
          { key: "paymentAmount", label: "Amount", type: "currency" },
          { key: "status", label: "Status" }
        ]}
      />
    </ProtectedShell>
  );
}

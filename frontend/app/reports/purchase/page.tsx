"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";
import { PURCHASE_REPORT_COLUMNS } from "@/components/reports/purchase-columns";

export default function AgentPurchaseReportPage() {
  return (
    <ProtectedShell roles={["AGENT"]} title="Purchase Report" subtitle="Your purchases">
      <ReportShell
        endpoint="/api/reports/purchase"
        fileName="purchase-report.xlsx"
        columns={PURCHASE_REPORT_COLUMNS.filter(
          (c) => !["username", "companyName"].includes(c.key)
        )}
      />
    </ProtectedShell>
  );
}

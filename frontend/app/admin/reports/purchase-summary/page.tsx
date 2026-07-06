"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";
import { PURCHASE_REPORT_COLUMNS } from "@/components/reports/purchase-columns";

export default function PurchaseSummaryReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Purchase Summary" subtitle="Purchase Report">
      <ReportShell
        endpoint="/api/reports/purchase"
        fileName="purchase-report.xlsx"
        showUserFilters
        columns={PURCHASE_REPORT_COLUMNS}
      />
    </ProtectedShell>
  );
}

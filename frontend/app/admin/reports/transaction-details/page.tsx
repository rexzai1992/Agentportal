"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";
import { PURCHASE_DETAILS_COLUMNS } from "@/components/reports/purchase-columns";

export default function TransactionDetailsReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Transaction Details" subtitle="Line-item transactions">
      <ReportShell
        endpoint="/api/reports/purchase-details"
        fileName="transaction-details-report.xlsx"
        showUserFilters
        columns={PURCHASE_DETAILS_COLUMNS}
      />
    </ProtectedShell>
  );
}

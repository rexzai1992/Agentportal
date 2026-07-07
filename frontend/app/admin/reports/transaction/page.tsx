"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";
import { PURCHASE_REPORT_COLUMNS } from "@/components/reports/purchase-columns";

export default function TransactionReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Transaction Report" subtitle="All portal transactions">
      <ReportShell
        endpoint="/api/reports/purchase"
        fileName="transaction-report.xlsx"
        extraParams={{ report: "transaction" }}
        showUserFilters
        columns={PURCHASE_REPORT_COLUMNS}
      />
    </ProtectedShell>
  );
}

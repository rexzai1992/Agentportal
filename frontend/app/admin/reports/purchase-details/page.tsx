"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";
import { PURCHASE_DETAILS_COLUMNS } from "@/components/reports/purchase-columns";

export default function PurchaseDetailsReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Purchase Details" subtitle="Purchase Details Report">
      <ReportShell
        endpoint="/api/reports/purchase-details"
        fileName="purchase-details-report.xlsx"
        showUserFilters
        columns={PURCHASE_DETAILS_COLUMNS}
      />
    </ProtectedShell>
  );
}

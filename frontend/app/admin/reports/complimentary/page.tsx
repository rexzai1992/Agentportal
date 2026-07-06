"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";

export default function ComplimentaryReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Complimentary Report" subtitle="Complimentary grants">
      <ReportShell
        endpoint="/api/reports/complimentary"
        fileName="complimentary-report.xlsx"
        showUserFilters
        columns={[
          { key: "username", label: "Username" },
          { key: "companyName", label: "Company Name" },
          { key: "quantity", label: "Quantity" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Date", type: "datetime" }
        ]}
      />
    </ProtectedShell>
  );
}

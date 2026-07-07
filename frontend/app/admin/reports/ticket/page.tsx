"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell, type ReportColumn } from "@/components/reports/report-shell";

const TICKET_REPORT_COLUMNS: ReportColumn[] = [
  { key: "username", label: "Username" },
  { key: "companyName", label: "Company Name" },
  { key: "reference", label: "Reference No.", type: "reference" },
  { key: "serialNo", label: "Ticket Serial No." },
  { key: "effectiveDate", label: "Effective Date", type: "date" },
  { key: "expiryDate", label: "Expiry Date", type: "date" },
  { key: "productType", label: "Product Type" },
  { key: "productName", label: "Product" },
  { key: "status", label: "Status", type: "status" }
];

export default function TicketReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Ticket Report" subtitle="All issued tickets">
      <ReportShell
        endpoint="/api/reports/ticket"
        fileName="ticket-report.xlsx"
        showUserFilters
        columns={TICKET_REPORT_COLUMNS}
      />
    </ProtectedShell>
  );
}

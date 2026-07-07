import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";

export default function AdminVoucherIssuedReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Voucher Issued" subtitle="Issued / used / available vouchers">
      <ReportShell
        endpoint="/api/reports/voucher-issued"
        fileName="voucher-issued-report.xlsx"
        showUserFilters
        columns={[
          { key: "username", label: "Username" },
          { key: "companyName", label: "Company Name" },
          { key: "reference", label: "Reference No." },
          { key: "productType", label: "Product Type" },
          { key: "productName", label: "Product" },
          { key: "issuedQty", label: "Issued" },
          { key: "usedQty", label: "Used" },
          { key: "availableQty", label: "Available" },
          { key: "effectiveDate", label: "Effective Date", type: "date" },
          { key: "expiryDate", label: "Expiry Date", type: "date" }
        ]}
      />
    </ProtectedShell>
  );
}

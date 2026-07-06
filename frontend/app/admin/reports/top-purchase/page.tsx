"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { ReportShell } from "@/components/reports/report-shell";

export default function TopPurchaseReportPage() {
  return (
    <ProtectedShell roles={["ADMIN"]} title="Top Purchase" subtitle="Most purchased products">
      <ReportShell
        endpoint="/api/reports/top-purchase"
        fileName="top-purchase-report.xlsx"
        showUserFilters
        columns={[
          { key: "username", label: "Username" },
          { key: "companyName", label: "Company Name" },
          { key: "productType", label: "Product Type" },
          { key: "productName", label: "Product" },
          { key: "itemQuantity", label: "Item Quantity" },
          { key: "nettAmount", label: "Nett Amount (RM)", type: "currency" }
        ]}
      />
    </ProtectedShell>
  );
}

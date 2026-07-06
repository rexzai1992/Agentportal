import type { ReportColumn } from "@/components/reports/report-shell";

/** Columns for the Purchase / Transaction reports (matches the OWG manual). */
export const PURCHASE_REPORT_COLUMNS: ReportColumn[] = [
  { key: "reference", label: "Reference No." },
  { key: "status", label: "Status" },
  { key: "username", label: "Username" },
  { key: "companyName", label: "Company Name" },
  { key: "transactionDate", label: "Transaction Date", type: "datetime" },
  { key: "productType", label: "Product Type" },
  { key: "nettAmount", label: "Nett Amount (RM)", type: "currency" },
  { key: "paymentDate", label: "Payment Date", type: "datetime" },
  { key: "paymentAmount", label: "Payment Amount (RM)", type: "currency" },
  { key: "salesApprovedBy", label: "Sales Approved By" },
  { key: "salesApprovedDate", label: "Sales Approved Date", type: "datetime" }
];

/** Columns for the Purchase Details / Transaction Details reports (line-item level). */
export const PURCHASE_DETAILS_COLUMNS: ReportColumn[] = [
  { key: "username", label: "Username" },
  { key: "companyName", label: "Company Name" },
  { key: "reference", label: "Reference No." },
  { key: "transactionDate", label: "Transaction Date", type: "datetime" },
  { key: "productType", label: "Product Type" },
  { key: "productName", label: "Product Name" },
  { key: "quantity", label: "Quantity" },
  { key: "price", label: "Price (RM)", type: "currency" },
  { key: "nettAmount", label: "Nett Amount (RM)", type: "currency" },
  { key: "status", label: "Status" }
];

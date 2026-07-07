import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const rows = await portalReportController.voucherIssued({
      agentId: sp.get("agentId") ?? undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: "Voucher Issued",
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Reference No.", key: "reference", width: 22 },
          { header: "Product Type", key: "productType", width: 18 },
          { header: "Product", key: "productName", width: 26 },
          { header: "Issued", key: "issuedQty", width: 12 },
          { header: "Used", key: "usedQty", width: 12 },
          { header: "Available", key: "availableQty", width: 12 },
          { header: "Effective Date", key: "effectiveDate", width: 22 },
          { header: "Expiry Date", key: "expiryDate", width: 22 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="voucher-issued-report.xlsx"'
        }
      });
    }

    return ok(rows);
  });
}

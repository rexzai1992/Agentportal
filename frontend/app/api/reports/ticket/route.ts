import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const rows = await portalReportController.ticket({
      serial: sp.get("serial") || undefined,
      qr: sp.get("qr") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: "Ticket Report",
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Reference No.", key: "reference", width: 22 },
          { header: "Ticket Serial No.", key: "serialNo", width: 28 },
          { header: "Effective Date", key: "effectiveDate", width: 22 },
          { header: "Expiry Date", key: "expiryDate", width: 22 },
          { header: "Product", key: "productName", width: 24 },
          { header: "Used Quantity", key: "usedQuantity", width: 14 },
          { header: "Entry Date", key: "entryDate", width: 22 },
          { header: "Status", key: "status", width: 14 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="ticket-report.xlsx"'
        }
      });
    }

    return ok(rows);
  });
}

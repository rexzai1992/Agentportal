import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const rows = await portalReportController.complimentary({
      agentId: sp.get("agentId") ?? undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: "Complimentary",
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Quantity", key: "quantity" },
          { header: "Status", key: "status" },
          { header: "Date", key: "createdAt", width: 24 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="complimentary-report.xlsx"'
        }
      });
    }

    return ok(rows);
  });
}

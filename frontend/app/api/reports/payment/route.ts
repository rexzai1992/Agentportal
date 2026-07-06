import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const sp = request.nextUrl.searchParams;
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : sp.get("agentId") ?? undefined;
    const rows = await portalReportController.payment({
      agentId,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: "Payment Report",
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Reference No", key: "reference", width: 22 },
          { header: "Payment Date", key: "paymentDate", width: 24 },
          { header: "Payment Name", key: "paymentName", width: 20 },
          { header: "Payment Amount (RM)", key: "paymentAmount", width: 20 },
          { header: "Status", key: "status", width: 18 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="payment-report.xlsx"'
        }
      });
    }

    return ok(rows);
  });
}

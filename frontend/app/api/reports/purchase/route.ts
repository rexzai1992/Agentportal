import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const sp = request.nextUrl.searchParams;
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : sp.get("agentId") ?? undefined;
    const report = sp.get("report");
    const exportMeta =
      report === "transaction"
        ? { sheetName: "Transaction Report", fileName: "transaction-report.xlsx" }
        : report === "purchase-summary"
          ? { sheetName: "Purchase Summary", fileName: "purchase-summary-report.xlsx" }
          : { sheetName: "Purchase Report", fileName: "purchase-report.xlsx" };
    const rows = await portalReportController.purchase({
      agentId,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      status: sp.get("status") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: exportMeta.sheetName,
        columns: [
          { header: "Reference No.", key: "reference", width: 22 },
          { header: "Status", key: "status", width: 20 },
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Transaction Date", key: "transactionDate", width: 24 },
          { header: "Product Type", key: "productType", width: 20 },
          { header: "Nett Amount (RM)", key: "nettAmount", width: 18 },
          { header: "Payment Date", key: "paymentDate", width: 24 },
          { header: "Payment Amount (RM)", key: "paymentAmount", width: 20 },
          { header: "Sales Approved By", key: "salesApprovedBy", width: 22 },
          { header: "Sales Approved Date", key: "salesApprovedDate", width: 24 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": `attachment; filename="${exportMeta.fileName}"`
        }
      });
    }

    return ok(rows);
  });
}

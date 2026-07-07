import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const sp = request.nextUrl.searchParams;
    const agentId =
      context.user.role === "AGENT" ? context.user.agentId ?? undefined : sp.get("agentId") ?? undefined;
    const report = sp.get("report");
    const exportMeta =
      report === "transaction-details"
        ? { sheetName: "Transaction Details", fileName: "transaction-details-report.xlsx" }
        : { sheetName: "Purchase Details", fileName: "purchase-details-report.xlsx" };
    const rows = await portalReportController.purchaseDetails({
      agentId,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: exportMeta.sheetName,
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Reference No.", key: "reference", width: 22 },
          { header: "Transaction Date", key: "transactionDate", width: 24 },
          { header: "Product Type", key: "productType", width: 18 },
          { header: "Product Name", key: "productName", width: 26 },
          { header: "Quantity", key: "quantity", width: 12 },
          { header: "Price (RM)", key: "price", width: 14 },
          { header: "Nett Amount (RM)", key: "nettAmount", width: 18 },
          { header: "Status", key: "status", width: 20 }
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

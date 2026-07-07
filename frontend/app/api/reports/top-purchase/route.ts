import { NextRequest, NextResponse } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => {
    const sp = request.nextUrl.searchParams;
    const limitRaw = Number(sp.get("limit"));
    const rows = await portalReportController.topPurchase({
      agentId: sp.get("agentId") ?? undefined,
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined,
      limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined
    });

    if (sp.get("format") === "xlsx") {
      const buffer = await buildWorkbook({
        sheetName: "Top Purchase",
        columns: [
          { header: "Username", key: "username" },
          { header: "Company Name", key: "companyName", width: 28 },
          { header: "Product Type", key: "productType", width: 18 },
          { header: "Product", key: "productName", width: 26 },
          { header: "Item Quantity", key: "itemQuantity", width: 14 },
          { header: "Nett Amount (RM)", key: "nettAmount", width: 18 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": 'attachment; filename="top-purchase-report.xlsx"'
        }
      });
    }

    return ok(rows);
  });
}

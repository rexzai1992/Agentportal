import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { ok, withAuth } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : undefined;
    const data = await purchaseController.orderVouchers(orderId, agentId);

    if (request.nextUrl.searchParams.get("format") === "xlsx") {
      const rows = await Promise.all(
        data.vouchers.map(async (v) => ({
          reference: data.reference,
          productName: data.productName ?? "",
          serialNo: v.serialNo,
          effectiveDate: v.effectiveDate,
          expiryDate: v.expiryDate,
          redeemedAt: v.redeemedAt ?? "-",
          entranceGate: v.entranceGate ?? "-",
          redeemStatus: v.redeemStatus,
          qr: {
            image: await QRCode.toBuffer(v.qrToken, { errorCorrectionLevel: "M", margin: 1, width: 90 }),
            width: 90,
            height: 90
          }
        }))
      );
      const buffer = await buildWorkbook({
        sheetName: "Voucher Detail",
        columns: [
          { header: "Reference No.", key: "reference", width: 22 },
          { header: "Product", key: "productName", width: 24 },
          { header: "Serial No.", key: "serialNo", width: 28 },
          { header: "QR Code", key: "qr", width: 14 },
          { header: "Effective Date", key: "effectiveDate", width: 22 },
          { header: "Expiry Date", key: "expiryDate", width: 22 },
          { header: "Last Redeem", key: "redeemedAt", width: 22 },
          { header: "Entrance Gate", key: "entranceGate", width: 18 },
          { header: "Status", key: "redeemStatus", width: 14 }
        ],
        rows
      });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": XLSX_CONTENT_TYPE,
          "Content-Disposition": `attachment; filename="voucher-detail-${data.reference || orderId}.xlsx"`
        }
      });
    }

    return ok(data);
  });
}

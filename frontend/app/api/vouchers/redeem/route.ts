import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function POST(request: NextRequest) {
  return withAuth(request, ["STAFF", "ADMIN"], async (context) => {
    const body = await parseBody<{ code?: string; entranceGate?: string }>(request);
    if (!body.code?.trim()) {
      return fail("Voucher serial or QR code is required", 400);
    }
    const result = await purchaseController.redeemVoucher({
      code: body.code,
      staffUserId: context.user.id,
      entranceGate: body.entranceGate
    });
    return ok(result);
  });
}

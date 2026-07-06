import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import type { PaymentDecision } from "@backend/services/offline-payment.service";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<{ decision: PaymentDecision; reason?: string }>(request);
    if (!body.decision || !["APPROVED", "REJECTED", "REVISION"].includes(body.decision)) {
      return fail("A valid decision is required", 400);
    }
    return ok(
      await purchaseController.approvePayment({
        id,
        decision: body.decision,
        reason: body.reason,
        adminUserId: context.user.id
      })
    );
  });
}

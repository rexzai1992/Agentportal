import { NextRequest } from "next/server";
import { requireActiveAgent } from "@backend/middleware/auth";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

interface Body {
  slipDocumentId: string;
  paymentGroupId?: string;
  paymentTypeId?: string;
  bankReference?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  return withAuth(request, ["AGENT"], async (context) => {
    requireActiveAgent(context);
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    const body = await parseBody<Body>(request);
    const result = await purchaseController.submitPayment({
      agentId: context.user.agentId,
      userId: context.user.id,
      orderReference: reference,
      slipDocumentId: body.slipDocumentId,
      paymentGroupId: body.paymentGroupId,
      paymentTypeId: body.paymentTypeId,
      bankReference: body.bankReference
    });
    return ok(result, 201);
  });
}

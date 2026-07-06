import { NextRequest } from "next/server";
import { PurchaseOrderStatus } from "@prisma/client";
import { requireActiveAgent } from "@backend/middleware/auth";
import { purchaseController } from "@backend/controllers/purchase.controller";
import type { CartItemInput } from "@backend/services/purchase-order.service";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const status = (request.nextUrl.searchParams.get("status") as PurchaseOrderStatus) || undefined;
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : undefined;
    return ok(await purchaseController.listOrders({ agentId, status }));
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    requireActiveAgent(context);
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    const body = await parseBody<{ items: CartItemInput[] }>(request);
    const result = await purchaseController.createOrder({
      agentId: context.user.agentId,
      userId: context.user.id,
      items: body.items
    });
    return ok(result, 201);
  });
}

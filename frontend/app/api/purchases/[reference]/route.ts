import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : undefined;
    return ok(await purchaseController.getOrder(reference, agentId));
  });
}

import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async (context) => {
    const sp = request.nextUrl.searchParams;
    const agentId = context.user.role === "AGENT" ? context.user.agentId ?? undefined : undefined;
    return ok(
      await purchaseController.voucherGroups({
        agentId,
        from: sp.get("from") || undefined,
        to: sp.get("to") || undefined
      })
    );
  });
}

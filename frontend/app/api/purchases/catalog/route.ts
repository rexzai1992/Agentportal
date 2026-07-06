import { NextRequest } from "next/server";
import { requireActiveAgent } from "@backend/middleware/auth";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { fail, ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    requireActiveAgent(context);
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    return ok(await purchaseController.catalog(context.user.agentId));
  });
}

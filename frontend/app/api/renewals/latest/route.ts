import { NextRequest } from "next/server";
import { renewalController } from "@backend/controllers/renewal.controller";
import { fail, ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    return ok(await renewalController.latest(context.user.agentId));
  });
}

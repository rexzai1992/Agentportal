import { NextRequest } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { fail, ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    return ok(await portalReportController.agentDashboard(context.user.agentId));
  });
}

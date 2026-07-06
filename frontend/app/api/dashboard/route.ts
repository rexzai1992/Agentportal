import { NextRequest } from "next/server";
import { dashboardController } from "@backend/controllers/dashboard.controller";
import { fail, ok, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) =>
    withErrorHandling(async () => {
      if (context.user.role === "ADMIN") {
        const data = await dashboardController.getAdminDashboardData();
        return ok({ role: "ADMIN", ...data });
      }

      if (!context.user.agentId) {
        return fail("Agent account mapping missing", 400);
      }

      const data = await dashboardController.getAgentDashboardData(context.user.agentId);
      return ok({ role: "AGENT", ...data });
    })
  );
}

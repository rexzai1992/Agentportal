import { NextRequest } from "next/server";
import { reportController } from "@backend/controllers/report.controller";
import { ok, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) =>
    withErrorHandling(async () => {
      const q = request.nextUrl.searchParams;
      const report = await reportController.getSalesReport({
        role: context.user.role,
        agentId: context.user.agentId,
        filterAgentId: q.get("agentId") ?? undefined,
        range: (q.get("range") as "today" | "7d" | "30d" | "custom" | null) ?? undefined,
        from: q.get("from") ?? undefined,
        to: q.get("to") ?? undefined
      });
      return ok(report);
    })
  );
}

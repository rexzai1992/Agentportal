import { NextRequest } from "next/server";
import { portalReportController } from "@backend/controllers/portal-report.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => ok(await portalReportController.adminCounts()));
}

import { NextRequest } from "next/server";
import { renewalController } from "@backend/controllers/renewal.controller";
import type { RenewalDecision } from "@backend/services/renewal.service";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<{ decision: RenewalDecision; remarks?: string }>(request);
    if (!body.decision || !["APPROVED", "REJECTED", "REVISION"].includes(body.decision)) {
      return fail("A valid decision is required", 400);
    }
    return ok(
      await renewalController.verify({
        id,
        decision: body.decision,
        remarks: body.remarks,
        adminUserId: context.user.id
      })
    );
  });
}

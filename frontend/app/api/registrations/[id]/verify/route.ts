import { NextRequest } from "next/server";
import { registrationController } from "@backend/controllers/registration.controller";
import type { VerificationDecision } from "@backend/services/registration.service";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

interface VerifyBody {
  decision?: VerificationDecision;
  remarks?: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<VerifyBody>(request);
    if (!body.decision || !["APPROVED", "REJECTED", "REVISION"].includes(body.decision)) {
      return fail("A valid decision is required", 400);
    }
    const result = await registrationController.verify({
      registrationId: id,
      decision: body.decision,
      remarks: body.remarks,
      adminUserId: context.user.id
    });
    return ok(result);
  });
}

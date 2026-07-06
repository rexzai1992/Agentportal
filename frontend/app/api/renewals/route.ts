import { NextRequest } from "next/server";
import { renewalController } from "@backend/controllers/renewal.controller";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => ok(await renewalController.list()));
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["AGENT"], async (context) => {
    if (!context.user.agentId) return fail("Account mapping missing", 400);
    const body = await parseBody<{
      kplLicenseNo?: string;
      kplExpiryDate?: string;
      ssmExpiryDate?: string;
      documentIds?: string[];
    }>(request);
    const result = await renewalController.create({
      agentId: context.user.agentId,
      userId: context.user.id,
      ...body
    });
    return ok(result, 201);
  });
}

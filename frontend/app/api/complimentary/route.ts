import { NextRequest } from "next/server";
import { complimentaryController } from "@backend/controllers/renewal.controller";
import type { ComplimentaryItemInput } from "@backend/services/complimentary.service";
import { fail, ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async () => ok(await complimentaryController.list()));
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<{ agentId: string; items: ComplimentaryItemInput[]; reason?: string }>(request);
    if (!body.agentId || !body.items?.length) {
      return fail("User and at least one product are required", 400);
    }
    const result = await complimentaryController.create({
      agentId: body.agentId,
      adminUserId: context.user.id,
      items: body.items,
      reason: body.reason
    });
    return ok(result, 201);
  });
}

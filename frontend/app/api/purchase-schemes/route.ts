import { NextRequest } from "next/server";
import { schemeController } from "@backend/controllers/scheme.controller";
import type { CreateSchemeInput } from "@backend/services/scheme.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  // AGENT can read scheme list (for reference); ADMIN manages.
  return withAuth(request, ["ADMIN", "AGENT"], async () => ok(await schemeController.list()));
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<CreateSchemeInput>(request);
    const created = await schemeController.create(body, context.user.id);
    return ok(created, 201);
  });
}

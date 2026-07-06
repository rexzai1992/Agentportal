import { NextRequest } from "next/server";
import { schemeController } from "@backend/controllers/scheme.controller";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async () => ok(await schemeController.listBindings(id)));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<{
      schemeId: string;
      bindingType?: string;
      incentive?: string | null;
      effectiveDate: string;
    }>(request);
    const result = await schemeController.createBinding(id, body, context.user.id);
    return ok(result, 201);
  });
}

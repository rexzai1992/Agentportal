import { NextRequest } from "next/server";
import { schemeController } from "@backend/controllers/scheme.controller";
import type { SchemeProductInput } from "@backend/services/scheme.service";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async (context) => {
    const body = await parseBody<{ effectiveDate: string; products: SchemeProductInput[] }>(request);
    const result = await schemeController.addRevision(id, body, context.user.id);
    return ok(result, 201);
  });
}

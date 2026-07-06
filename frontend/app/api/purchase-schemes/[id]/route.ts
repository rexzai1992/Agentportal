import { NextRequest } from "next/server";
import { SchemeStatus } from "@prisma/client";
import { schemeController } from "@backend/controllers/scheme.controller";
import { ok, parseBody, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN", "AGENT"], async () => ok(await schemeController.detail(id)));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN"], async () => {
    const body = await parseBody<{ status: SchemeStatus }>(request);
    return ok(await schemeController.updateStatus(id, body.status));
  });
}

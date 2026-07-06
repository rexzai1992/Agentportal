import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["FINANCE", "ADMIN"], async (context) =>
    ok(await purchaseController.markPaid(id, context.user.id))
  );
}

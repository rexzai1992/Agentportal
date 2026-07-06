import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(request, ["ADMIN", "FINANCE"], async () =>
    ok(await purchaseController.paymentDetail(id))
  );
}

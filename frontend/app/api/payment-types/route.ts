import { NextRequest } from "next/server";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["AGENT", "ADMIN"], async () => ok(await purchaseController.paymentTypes()));
}

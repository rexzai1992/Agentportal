import { NextRequest } from "next/server";
import { OfflinePaymentStatus } from "@prisma/client";
import { purchaseController } from "@backend/controllers/purchase.controller";
import { ok, withAuth } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "FINANCE"], async () => {
    const status = (request.nextUrl.searchParams.get("status") as OfflinePaymentStatus) || undefined;
    return ok(await purchaseController.listPayments({ status }));
  });
}

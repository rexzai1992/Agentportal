import { NextRequest } from "next/server";
import { bookingController } from "@backend/controllers/booking.controller";
import { ok, withAuth, withErrorHandling } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) =>
    withErrorHandling(async () => {
      const { id } = await params;
      const booking = await bookingController.getBookingById(id, {
        role: context.user.role,
        agentId: context.user.agentId
      });
      return ok(booking);
    })
  );
}

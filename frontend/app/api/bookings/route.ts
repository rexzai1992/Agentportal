import { NextRequest } from "next/server";
import { bookingController } from "@backend/controllers/booking.controller";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface CreateBookingBody {
  agentId?: string;
  customerName: string;
  customerPhone?: string;
  visitDate: string;
  items: Array<{ ticketTypeId: string; quantity: number }>;
}

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) => {
    const searchParams = request.nextUrl.searchParams;
    const bookingReference = searchParams.get("bookingReference") ?? undefined;
    const requestedLimit = Number(searchParams.get("limit") ?? "200");
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 500)
        : 200;

    const bookings = await bookingController.listBookings({
      role: context.user.role,
      agentId: context.user.agentId,
      bookingReference,
      limit
    });

    return ok(bookings);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) =>
    withErrorHandling(async () => {
      const body = await parseBody<CreateBookingBody>(request);

      if (!body.customerName || !body.visitDate || !body.items?.length) {
        return fail("Missing required booking fields", 400);
      }

      const resolvedAgentId = context.user.role === "AGENT" ? context.user.agentId : body.agentId;
      if (!resolvedAgentId) {
        return fail("Agent ID is required", 400);
      }

      const booking = await bookingController.createBooking({
        agentId: resolvedAgentId,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        visitDate: body.visitDate,
        items: body.items,
        createdByUserId: context.user.id
      });

      return ok(booking, 201);
    })
  );
}

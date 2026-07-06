import { NextRequest, NextResponse } from "next/server";
import { ticketController } from "@backend/controllers/ticket.controller";
import { buildWorkbook, XLSX_CONTENT_TYPE } from "@backend/services/export/excel.service";
import { TicketStatus } from "@shared/types/domain";
import { fail, ok, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT", "STAFF"], async (context) =>
    withErrorHandling(async () => {
      const searchParams = request.nextUrl.searchParams;
      const statusRaw = searchParams.get("status") as TicketStatus | null;
      const bookingReference = searchParams.get("bookingReference") ?? undefined;
      const requestedLimit = Number(searchParams.get("limit") ?? "200");
      const limit =
        Number.isFinite(requestedLimit) && requestedLimit > 0
          ? Math.min(Math.floor(requestedLimit), 500)
          : 200;

      if (statusRaw && !["ACTIVE", "USED", "EXPIRED", "CANCELLED"].includes(statusRaw)) {
        return fail("Invalid ticket status", 400);
      }

      const tickets = await ticketController.listTickets({
        role: context.user.role,
        agentId: context.user.agentId,
        status: statusRaw || undefined,
        bookingReference,
        limit
      });

      if (searchParams.get("format") === "xlsx") {
        const rows = tickets.map((t: Record<string, unknown>) => {
          const booking = t.booking as { bookingReference?: string; customerName?: string } | null;
          const ticketType = t.ticketType as { name?: string } | null;
          return {
            ticketCode: t.ticketCode,
            productName: ticketType?.name ?? "-",
            bookingReference: booking?.bookingReference ?? "-",
            customerName: booking?.customerName ?? "-",
            visitDate: t.visitDate,
            status: t.status,
            checkedInAt: t.checkedInAt ?? "-"
          };
        });

        const buffer = await buildWorkbook({
          sheetName: "Ticket Report",
          columns: [
            { header: "Ticket Code", key: "ticketCode", width: 26 },
            { header: "Type", key: "productName", width: 24 },
            { header: "Booking Reference", key: "bookingReference", width: 22 },
            { header: "Customer Name", key: "customerName", width: 24 },
            { header: "Visit Date", key: "visitDate", width: 22 },
            { header: "Status", key: "status", width: 14 },
            { header: "Check-In", key: "checkedInAt", width: 22 }
          ],
          rows
        });

        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": XLSX_CONTENT_TYPE,
            "Content-Disposition": 'attachment; filename="tickets.xlsx"'
          }
        });
      }

      return ok(tickets);
    })
  );
}

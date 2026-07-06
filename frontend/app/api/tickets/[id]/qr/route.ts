import { NextRequest } from "next/server";
import { ticketController } from "@backend/controllers/ticket.controller";
import { ok, withAuth, withErrorHandling } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(request, ["ADMIN", "AGENT", "STAFF"], async (context) =>
    withErrorHandling(async () => {
      const { id } = await params;
      await ticketController.getTicketById(id, {
        role: context.user.role,
        agentId: context.user.agentId
      });

      const payload = await ticketController.generateTicketQrPayload(id);
      const dataUrl = await ticketController.generateTicketQrDataUrlFromPayload(payload);

      return ok({ payload, dataUrl });
    })
  );
}

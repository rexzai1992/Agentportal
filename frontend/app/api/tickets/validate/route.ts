import { NextRequest } from "next/server";
import { ticketController } from "@backend/controllers/ticket.controller";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface ValidateBody {
  ticketId: string;
  qrToken: string;
  signature: string;
  ts: number;
  checkedInAt?: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN", "STAFF"], async (context) =>
    withErrorHandling(async () => {
      const body = await parseBody<ValidateBody>(request);
      if (!body.ticketId || !body.qrToken || !body.signature || !body.ts) {
        return fail("ticketId, qrToken, signature and ts are required", 400);
      }

      const result = await ticketController.validateTicketScan({
        input: {
          ticketId: body.ticketId,
          qrToken: body.qrToken,
          signature: body.signature,
          ts: Number(body.ts)
        },
        staffUserId: context.user.id,
        checkedInAt: body.checkedInAt
      });

      return ok(result);
    })
  );
}

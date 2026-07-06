import { NextRequest } from "next/server";
import { invoiceController } from "@backend/controllers/invoice.controller";
import { ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface GenerateBody {
  agentId?: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const body = await parseBody<GenerateBody>(request);
      const invoices = await invoiceController.generateInvoices({
        initiatedBy: context.user.id,
        agentId: body.agentId
      });
      return ok(invoices, 201);
    })
  );
}

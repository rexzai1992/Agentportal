import { NextRequest } from "next/server";
import { invoiceController } from "@backend/controllers/invoice.controller";
import { InvoiceStatus } from "@shared/types/domain";
import { fail, ok, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) =>
    withErrorHandling(async () => {
      const statusRaw = request.nextUrl.searchParams.get("status") as InvoiceStatus | null;

      if (statusRaw && !["DRAFT", "ISSUED", "PAID", "OVERDUE"].includes(statusRaw)) {
        return fail("Invalid invoice status", 400);
      }

      const invoices = await invoiceController.listInvoices({
        role: context.user.role,
        agentId: context.user.agentId,
        status: statusRaw || undefined
      });

      return ok(invoices);
    })
  );
}

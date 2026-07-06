import { NextRequest } from "next/server";
import { invoiceController } from "@backend/controllers/invoice.controller";
import { ok, withAuth, withErrorHandling } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const { id } = await params;
      const invoice = await invoiceController.markInvoicePaid({
        id,
        paidByUserId: context.user.id
      });
      return ok(invoice);
    })
  );
}

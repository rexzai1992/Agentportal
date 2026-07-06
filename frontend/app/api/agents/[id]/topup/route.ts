import { NextRequest } from "next/server";
import { agentController } from "@backend/controllers/agent.controller";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

interface TopUpBody {
  amount: number;
  reference: string;
  notes?: string;
}

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const { id } = await params;
      const body = await parseBody<TopUpBody>(request);

      if (!body.amount || !body.reference) {
        return fail("Amount and reference are required", 400);
      }

      const result = await agentController.topUpAgent({
        agentId: id,
        amount: Number(body.amount),
        reference: body.reference,
        notes: body.notes,
        adminUserId: context.user.id
      });

      return ok(result, 201);
    })
  );
}

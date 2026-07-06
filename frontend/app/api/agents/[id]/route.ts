import { NextRequest } from "next/server";
import { agentController } from "@backend/controllers/agent.controller";
import { ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

interface UpdateAgentBody {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  agreementType?: "PREPAID" | "WEEKLY" | "MONTHLY";
  commissionRate?: number;
  creditLimit?: number | null;
  isActive?: boolean;
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const { id } = await params;
      const body = await parseBody<UpdateAgentBody>(request);
      const updated = await agentController.updateAgent(id, body, context.user.id);
      return ok(updated);
    })
  );
}

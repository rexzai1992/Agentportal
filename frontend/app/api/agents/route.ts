import { NextRequest } from "next/server";
import { agentController } from "@backend/controllers/agent.controller";
import { fail, ok, parseBody, withAuth, withErrorHandling } from "@/lib/api";

export async function GET(request: NextRequest) {
  return withAuth(request, ["ADMIN", "AGENT"], async (context) => {
    if (context.user.role === "AGENT" && !context.user.agentId) {
      return fail("Agent account mapping missing", 400);
    }

    const agents = await agentController.listAgents(
      context.user.role === "AGENT" ? { agentId: context.user.agentId } : undefined
    );

    return ok(agents);
  });
}

interface CreateAgentBody {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  agreementType: "PREPAID" | "WEEKLY" | "MONTHLY";
  commissionRate: number;
  creditLimit?: number | null;
  initialBalance?: number | null;
  billingCycleStartDate?: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, ["ADMIN"], async (context) =>
    withErrorHandling(async () => {
      const body = await parseBody<CreateAgentBody>(request);
      if (!body.companyName || !body.email || !body.phone || !body.agreementType) {
        return fail("Missing required fields", 400);
      }

      const created = await agentController.createAgent(body, context.user.id);
      return ok(created, 201);
    })
  );
}

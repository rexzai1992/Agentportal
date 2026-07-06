import { prisma } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";
import { issueVouchersForComplimentary } from "@backend/services/voucher.service";

const MIN_COMPLIMENTARY_QTY = 20;

export interface ComplimentaryItemInput {
  ticketTypeId: string;
  quantity: number;
}

export const createComplimentary = async (params: {
  agentId: string;
  adminUserId: string;
  items: ComplimentaryItemInput[];
  reason?: string;
}) => {
  const totalQty = params.items.reduce((sum, i) => sum + i.quantity, 0);
  if (totalQty < MIN_COMPLIMENTARY_QTY) {
    throw new Error(`Minimum complimentary order is ${MIN_COMPLIMENTARY_QTY} tickets`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const grant = await tx.complimentaryGrant.create({
      data: {
        agentId: params.agentId,
        quantity: totalQty,
        reason: params.reason || null,
        status: "APPROVED",
        createdByUserId: params.adminUserId
      }
    });

    for (const item of params.items) {
      await issueVouchersForComplimentary(
        grant.id,
        item.ticketTypeId,
        params.agentId,
        item.quantity,
        tx
      );
    }
    return grant;
  });

  await logActivity({
    userId: params.adminUserId,
    action: "COMPLIMENTARY_CREATED",
    entityType: "COMPLIMENTARY",
    entityId: result.id,
    description: `Complimentary ${totalQty} tickets granted`
  });

  return { id: result.id, quantity: totalQty };
};

export const listComplimentary = async () => {
  const grants = await prisma.complimentaryGrant.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { companyName: true, accountCode: true } } }
  });
  return grants.map((g) => ({
    id: g.id,
    companyName: g.agent.companyName,
    accountCode: g.agent.accountCode,
    quantity: g.quantity,
    status: g.status,
    createdAt: g.createdAt.toISOString()
  }));
};

/** Selectable users (active agents/partners) for complimentary grants. */
export const listComplimentaryUsers = async () => {
  const agents = await prisma.agent.findMany({
    where: { accountStatus: "ACTIVE" },
    select: { id: true, companyName: true, accountCode: true, partyType: true },
    orderBy: { companyName: "asc" }
  });
  return agents;
};

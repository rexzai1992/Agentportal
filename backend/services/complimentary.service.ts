import { prisma } from "@backend/services/db";
import { Prisma } from "@prisma/client";
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
  const items = validateItems(params.items);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  return prisma.$transaction(async (tx) => {
    await validateRecipientAndProducts(tx, params.agentId, items);
    const grant = await tx.complimentaryGrant.create({ data: {
      agentId: params.agentId, quantity: totalQty, reason: params.reason?.trim() || null,
      status: "PENDING", createdByUserId: params.adminUserId,
      requestedItems: items as unknown as Prisma.InputJsonValue
    } });
    await tx.activityLog.create({ data: {
      userId: params.adminUserId, action: "COMPLIMENTARY_REQUESTED", entityType: "COMPLIMENTARY",
      entityId: grant.id, description: `Requested ${totalQty} complimentary tickets; awaiting Finance approval`
    } });
    return { id: grant.id, quantity: totalQty, status: grant.status };
  });
};

const validateItems = (input: unknown): ComplimentaryItemInput[] => {
  if (!Array.isArray(input) || input.length === 0) throw new Error("At least one product is required");
  const seen = new Set<string>();
  const items = input.map((item) => {
    if (!item || typeof item.ticketTypeId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each product needs a positive whole-number quantity");
    }
    if (seen.has(item.ticketTypeId)) throw new Error("Duplicate products are not allowed");
    seen.add(item.ticketTypeId);
    return { ticketTypeId: item.ticketTypeId, quantity: item.quantity };
  });
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  if (!Number.isSafeInteger(total) || total < MIN_COMPLIMENTARY_QTY || total > 10000) {
    throw new Error(`Complimentary requests must contain ${MIN_COMPLIMENTARY_QTY} to 10000 tickets`);
  }
  return items;
};

async function validateRecipientAndProducts(tx: Prisma.TransactionClient, agentId: string, items: ComplimentaryItemInput[]) {
  const agent = await tx.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.accountStatus !== "ACTIVE" || (agent.accountExpiry && agent.accountExpiry <= new Date())) {
    throw new Error("Recipient account must be active and not expired");
  }
  const count = await tx.ticketType.count({ where: {
    id: { in: items.map((item) => item.ticketTypeId) }, active: true, outlet: { active: true }
  } });
  if (count !== items.length) throw new Error("All requested products and outlets must be active");
}

export async function reviewComplimentary(params: { id: string; userId: string; decision: "APPROVED" | "REJECTED"; remarks?: string }) {
  if (!["APPROVED", "REJECTED"].includes(params.decision)) throw new Error("Invalid review decision");
  if (params.decision === "REJECTED" && !params.remarks?.trim()) throw new Error("A rejection reason is required");
  return prisma.$transaction(async (tx) => {
    const reviewer = await tx.user.findUnique({ where: { id: params.userId } });
    if (!reviewer || reviewer.role !== "FINANCE") throw new Error("Forbidden");
    const grant = await tx.complimentaryGrant.findUnique({ where: { id: params.id } });
    if (!grant) throw new Error("Complimentary request not found");
    if (grant.createdByUserId === params.userId) throw new Error("You cannot approve or reject your own request");
    if (grant.status !== "PENDING") throw new Error("This request has already been reviewed");
    // Conditional transition makes concurrent and repeated approvals issue vouchers only once.
    const changed = await tx.complimentaryGrant.updateMany({ where: { id: grant.id, status: "PENDING" }, data: {
      status: params.decision, reviewedByUserId: params.userId, reviewedAt: new Date(), reviewRemarks: params.remarks?.trim() || null
    } });
    if (changed.count !== 1) throw new Error("This request has already been reviewed");
    if (params.decision === "APPROVED") {
      const items = validateItems(grant.requestedItems);
      await validateRecipientAndProducts(tx, grant.agentId, items);
      for (const item of items) await issueVouchersForComplimentary(grant.id, item.ticketTypeId, grant.agentId, item.quantity, tx);
    }
    await tx.activityLog.create({ data: {
      userId: params.userId, action: `COMPLIMENTARY_${params.decision}`, entityType: "COMPLIMENTARY",
      entityId: grant.id, description: `Complimentary request ${params.decision.toLowerCase()}`
    } });
    return { id: grant.id, status: params.decision };
  }, { timeout: 30000 });
}

export const listComplimentary = async () => {
  const grants = await prisma.complimentaryGrant.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { companyName: true, accountCode: true } }, vouchers: { select: { ticketTypeId: true } } }
  });
  const productIds = [...new Set(grants.flatMap((g) => Array.isArray(g.requestedItems)
    ? (g.requestedItems as unknown as ComplimentaryItemInput[]).map((item) => item.ticketTypeId) : []))];
  const products = await prisma.ticketType.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const names = new Map(products.map((p) => [p.id, p.name]));
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(grants.flatMap((g) => [g.createdByUserId, ...(g.reviewedByUserId ? [g.reviewedByUserId] : [])]))] } }, select: { id: true, fullName: true } });
  const userNames = new Map(users.map((u) => [u.id, u.fullName]));
  return grants.map((g) => ({
    id: g.id,
    companyName: g.agent.companyName,
    accountCode: g.agent.accountCode,
    quantity: g.quantity,
    status: g.status,
    reason: g.reason,
    requestedBy: userNames.get(g.createdByUserId) ?? "Unknown",
    reviewedBy: g.reviewedByUserId ? userNames.get(g.reviewedByUserId) ?? "Unknown" : null,
    reviewedAt: g.reviewedAt?.toISOString() ?? null,
    reviewRemarks: g.reviewRemarks,
    issuedQuantity: g.vouchers.length,
    items: Array.isArray(g.requestedItems) ? (g.requestedItems as unknown as ComplimentaryItemInput[]).map((item) => ({ ...item, name: names.get(item.ticketTypeId) ?? "Product unavailable" })) : [],
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

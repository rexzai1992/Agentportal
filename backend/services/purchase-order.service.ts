import crypto from "node:crypto";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma, asNumber, toMoney } from "@backend/services/db";

const generateReference = (): string => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const seq = crypto.randomInt(100000, 999999);
  return `AGT-${yy}-${seq}`;
};

/** Resolves the catalog (purchasable products) for an agent from bound schemes. */
const resolveAgentCatalog = async (agentId: string, client: Prisma.TransactionClient, now: Date) => {
  const agent = await client.agent.findUnique({ where: { id: agentId }, select: { accountStatus: true, accountExpiry: true } });
  if (!agent || agent.accountStatus !== "ACTIVE" || (agent.accountExpiry && agent.accountExpiry <= now)) {
    throw new Error("Account is inactive or expired; purchasing is unavailable");
  }
  const assignments = await client.schemeAssignment.findMany({
    where: { agentId, effectiveDate: { lte: now }, scheme: { status: "ACTIVE" } },
    select: { schemeId: true }
  });
  const schemeIds = assignments.map((a) => a.schemeId);
  if (schemeIds.length === 0) return [];

  // Latest revision per scheme (effective now or earlier).
  const revisions = await client.schemeRevision.findMany({
    where: { schemeId: { in: schemeIds }, effectiveDate: { lte: now }, status: "ACTIVE" },
    orderBy: [{ schemeId: "asc" }, { revisionNumber: "desc" }],
    include: {
      products: {
        where: { ticketType: { active: true, outlet: { active: true } } },
        include: {
          ticketType: { select: { name: true, category: true, outlet: { select: { name: true } } } }
        }
      }
    }
  });

  const latestBySchemeId = new Map<string, (typeof revisions)[number]>();
  for (const rev of revisions) {
    if (!latestBySchemeId.has(rev.schemeId)) latestBySchemeId.set(rev.schemeId, rev);
  }

  const catalog: Array<{
    schemeProductId: string;
    schemeRevisionId: string;
    ticketTypeId: string;
    name: string;
    category: string;
    outletName: string;
    price: number;
    minQty: number;
    maxQty: number | null;
    incentiveRate: number | null;
    discountRate: number | null;
  }> = [];

  for (const rev of latestBySchemeId.values()) {
    for (const p of rev.products) {
      catalog.push({
        schemeProductId: p.id,
        schemeRevisionId: rev.id,
        ticketTypeId: p.ticketTypeId,
        name: p.ticketType.name,
        category: p.ticketType.category,
        outletName: p.ticketType.outlet.name,
        price: asNumber(p.price),
        minQty: p.minQty,
        maxQty: p.maxQty,
        incentiveRate: p.incentiveRate ? asNumber(p.incentiveRate) : null,
        discountRate: p.discountRate ? asNumber(p.discountRate) : null
      });
    }
  }
  return catalog;
};

export const getAgentCatalog = (agentId: string) =>
  prisma.$transaction((tx) => resolveAgentCatalog(agentId, tx, new Date()), {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
  });

export interface CartItemInput {
  schemeProductId: string;
  quantity: number;
}

export const createPurchaseOrder = async (params: {
  agentId: string;
  userId: string;
  items: CartItemInput[];
}) => {
  if (!Array.isArray(params.items) || !params.items.length) throw new Error("Cart is empty");
  const seen = new Set<string>();
  for (const item of params.items) {
    if (!item || typeof item.schemeProductId !== "string" || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Each cart item needs a product and a positive whole-number quantity");
    }
    if (seen.has(item.schemeProductId)) throw new Error("Combine duplicate product rows before checkout");
    seen.add(item.schemeProductId);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const catalog = await resolveAgentCatalog(params.agentId, tx, new Date());
      const byId = new Map(catalog.map((p) => [p.schemeProductId, p]));

      let subtotal = 0;
      let incentiveTotal = 0;
      let discountTotal = 0;
      let schemeRevisionId: string | null = null;

      const items = params.items.map((item) => {
        const sp = byId.get(item.schemeProductId);
        if (!sp) throw new Error("A product or price is no longer available for your account. Refresh the catalog and update your cart.");
        const qty = item.quantity;
        if (qty < sp.minQty || (sp.maxQty !== null && qty > sp.maxQty)) {
          throw new Error(`Quantity for ${sp.name} must be between ${sp.minQty} and ${sp.maxQty ?? "the available limit"}`);
        }

        const unitPrice = asNumber(sp.price);
        const lineTotal = toMoney(unitPrice * qty);
        subtotal += lineTotal;
        if (sp.incentiveRate) incentiveTotal += toMoney((lineTotal * asNumber(sp.incentiveRate)) / 100);
        if (sp.discountRate) discountTotal += toMoney((lineTotal * asNumber(sp.discountRate)) / 100);
        schemeRevisionId = sp.schemeRevisionId;

        return {
          ticketTypeId: sp.ticketTypeId,
          schemeProductId: sp.schemeProductId,
          quantity: qty,
          unitPrice,
          lineTotal
        };
      });

      const totalPayable = toMoney(subtotal - discountTotal);

      const order = await tx.purchaseOrder.create({
        data: {
          orderReference: generateReference(),
          agentId: params.agentId,
          schemeRevisionId,
          status: "PENDING_PAYMENT",
          subtotal: toMoney(subtotal),
          incentiveTotal: toMoney(incentiveTotal),
          discountTotal: toMoney(discountTotal),
          totalPayable,
          createdByUserId: params.userId,
          items: { create: items }
        }
      });

      await tx.activityLog.create({ data: {
        userId: params.userId,
        action: "PURCHASE_ORDER_CREATED",
        entityType: "PURCHASE_ORDER",
        entityId: order.id,
        description: `Created purchase order ${order.orderReference}`
      } });

      return { id: order.id, orderReference: order.orderReference };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new Error("Pricing changed during checkout. Refresh the catalog and try again.");
    }
    throw error;
  }
};

const serializeOrder = (order: {
  id: string;
  orderReference: string;
  status: PurchaseOrderStatus;
  subtotal: unknown;
  incentiveTotal: unknown;
  discountTotal: unknown;
  totalPayable: unknown;
  createdAt: Date;
  agent: { companyName: string; accountCode: string | null };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: unknown;
    lineTotal: unknown;
    ticketType: {
      name: string;
      category: string;
      outlet?: {
        name: string;
        bankName: string | null;
        bankAccountName: string | null;
        bankAccountNo: string | null;
      } | null;
    };
  }>;
}) => ({
  id: order.id,
  orderReference: order.orderReference,
  status: order.status,
  subtotal: asNumber(order.subtotal as number),
  incentiveTotal: asNumber(order.incentiveTotal as number),
  discountTotal: asNumber(order.discountTotal as number),
  totalPayable: asNumber(order.totalPayable as number),
  transactionDate: order.createdAt.toISOString(),
  companyName: order.agent.companyName,
  accountCode: order.agent.accountCode,
  items: order.items.map((i) => ({
    id: i.id,
    productName: i.ticketType.name,
    productType: i.ticketType.category,
    quantity: i.quantity,
    unitPrice: asNumber(i.unitPrice as number),
    lineTotal: asNumber(i.lineTotal as number)
  })),
  bankAccounts: Array.from(
    new Map(
      order.items
        .map((i) => i.ticketType.outlet)
        .filter(
          (outlet): outlet is NonNullable<typeof outlet> =>
            Boolean(outlet && (outlet.bankName || outlet.bankAccountNo))
        )
        .map((outlet) => [
          `${outlet.bankName}|${outlet.bankAccountNo}`,
          {
            outletName: outlet.name,
            bankName: outlet.bankName,
            bankAccountName: outlet.bankAccountName,
            bankAccountNo: outlet.bankAccountNo
          }
        ])
    ).values()
  )
});

export const getPurchaseOrder = async (orderReference: string, agentId?: string) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { orderReference },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      items: {
        include: {
          ticketType: {
            select: {
              name: true,
              category: true,
              outlet: {
                select: { name: true, bankName: true, bankAccountName: true, bankAccountNo: true }
              }
            }
          }
        }
      }
    }
  });
  if (!order) throw new Error("Purchase order not found");
  if (agentId && order.agentId !== agentId) throw new Error("Purchase order not found");
  return serializeOrder(order);
};

export const listPurchaseOrders = async (params: {
  agentId?: string;
  status?: PurchaseOrderStatus;
}) => {
  const orders = await prisma.purchaseOrder.findMany({
    where: { agentId: params.agentId, status: params.status },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      items: { include: { ticketType: { select: { name: true, category: true } } } }
    }
  });
  return orders.map(serializeOrder);
};

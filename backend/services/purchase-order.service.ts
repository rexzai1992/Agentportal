import crypto from "node:crypto";
import { PurchaseOrderStatus } from "@prisma/client";
import { prisma, asNumber, toMoney } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";

const generateReference = (): string => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const seq = crypto.randomInt(100000, 999999);
  return `AGT-${yy}-${seq}`;
};

/** Resolves the catalog (purchasable products) for an agent from bound schemes. */
export const getAgentCatalog = async (agentId: string) => {
  const assignments = await prisma.schemeAssignment.findMany({
    where: { agentId, scheme: { status: "ACTIVE" } },
    select: { schemeId: true }
  });
  const schemeIds = assignments.map((a) => a.schemeId);
  if (schemeIds.length === 0) return [];

  // Latest revision per scheme (effective now or earlier).
  const revisions = await prisma.schemeRevision.findMany({
    where: { schemeId: { in: schemeIds }, effectiveDate: { lte: new Date() }, status: "ACTIVE" },
    orderBy: [{ schemeId: "asc" }, { revisionNumber: "desc" }],
    include: {
      products: { include: { ticketType: { select: { name: true, category: true } } } }
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

export interface CartItemInput {
  schemeProductId: string;
  quantity: number;
}

export const createPurchaseOrder = async (params: {
  agentId: string;
  userId: string;
  items: CartItemInput[];
}) => {
  if (!params.items?.length) throw new Error("Cart is empty");

  const schemeProducts = await prisma.schemeProduct.findMany({
    where: { id: { in: params.items.map((i) => i.schemeProductId) } }
  });
  const byId = new Map(schemeProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  let incentiveTotal = 0;
  let discountTotal = 0;
  let schemeRevisionId: string | null = null;

  const items = params.items.map((item) => {
    const sp = byId.get(item.schemeProductId);
    if (!sp) throw new Error("Invalid product in cart");
    let qty = item.quantity;
    if (qty < sp.minQty) qty = sp.minQty;
    if (sp.maxQty && qty > sp.maxQty) qty = sp.maxQty;

    const unitPrice = asNumber(sp.price);
    const lineTotal = toMoney(unitPrice * qty);
    subtotal += lineTotal;
    if (sp.incentiveRate) incentiveTotal += toMoney((lineTotal * asNumber(sp.incentiveRate)) / 100);
    if (sp.discountRate) discountTotal += toMoney((lineTotal * asNumber(sp.discountRate)) / 100);
    schemeRevisionId = sp.schemeRevisionId;

    return {
      ticketTypeId: sp.ticketTypeId,
      schemeProductId: sp.id,
      quantity: qty,
      unitPrice,
      lineTotal
    };
  });

  const totalPayable = toMoney(subtotal - discountTotal);

  const order = await prisma.purchaseOrder.create({
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

  await logActivity({
    userId: params.userId,
    action: "PURCHASE_ORDER_CREATED",
    entityType: "PURCHASE_ORDER",
    entityId: order.id,
    description: `Created purchase order ${order.orderReference}`
  });

  return { id: order.id, orderReference: order.orderReference };
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
    ticketType: { name: string; category: string };
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
  }))
});

export const getPurchaseOrder = async (orderReference: string, agentId?: string) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { orderReference },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      items: { include: { ticketType: { select: { name: true, category: true } } } }
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

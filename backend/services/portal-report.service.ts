import { startOfDay, endOfDay } from "date-fns";
import { prisma, asNumber } from "@backend/services/db";

export const getAdminCounts = async () => {
  const [pendingAgent, pendingPartner, totalAgents, totalPartners, pendingPayments] = await Promise.all([
    prisma.registration.count({ where: { partyType: "AGENT", status: "PENDING" } }),
    prisma.registration.count({ where: { partyType: "PARTNER", status: "PENDING" } }),
    prisma.agent.count({ where: { partyType: "AGENT" } }),
    prisma.agent.count({ where: { partyType: "PARTNER" } }),
    prisma.offlinePayment.count({ where: { status: "PENDING_APPROVAL" } })
  ]);
  return { pendingAgent, pendingPartner, totalAgents, totalPartners, pendingPayments };
};

export const getAgentDashboard = async (agentId: string) => {
  const now = new Date();
  const [pendingApproval, incompleteOrders, todaysPurchases] = await Promise.all([
    prisma.offlinePayment.count({ where: { agentId, status: "PENDING_APPROVAL" } }),
    prisma.purchaseOrder.count({ where: { agentId, status: "PENDING_PAYMENT" } }),
    prisma.purchaseOrder.count({
      where: { agentId, createdAt: { gte: startOfDay(now), lte: endOfDay(now) } }
    })
  ]);
  return { pendingApproval, incompleteOrders, todaysPurchases };
};

const rangeFilter = (from?: string, to?: string) =>
  from || to
    ? {
        gte: from ? startOfDay(new Date(from)) : undefined,
        lte: to ? endOfDay(new Date(to)) : undefined
      }
    : undefined;

export interface ReportParams {
  agentId?: string;
  from?: string;
  to?: string;
  status?: string;
}

export const purchaseReport = async (params: ReportParams) => {
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      agentId: params.agentId,
      status: params.status ? (params.status as never) : undefined,
      createdAt: rangeFilter(params.from, params.to)
    },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      items: { include: { ticketType: { select: { category: true } } } },
      paymentLinks: {
        include: {
          offlinePayment: {
            select: {
              amount: true,
              financePaidAt: true,
              createdAt: true,
              adminApprovedByUserId: true,
              adminApprovedAt: true
            }
          }
        }
      }
    }
  });

  // Resolve "Sales Approved By" user names in one query.
  const approverIds = Array.from(
    new Set(
      orders
        .flatMap((o) => o.paymentLinks.map((l) => l.offlinePayment.adminApprovedByUserId))
        .filter((id): id is string => Boolean(id))
    )
  );
  const approvers = approverIds.length
    ? await prisma.user.findMany({
        where: { id: { in: approverIds } },
        select: { id: true, fullName: true }
      })
    : [];
  const approverNameById = new Map(approvers.map((u) => [u.id, u.fullName]));

  return orders.map((o) => {
    const pay = o.paymentLinks[0]?.offlinePayment;
    return {
      reference: o.orderReference,
      status: o.status,
      username: o.agent.accountCode ?? "-",
      companyName: o.agent.companyName,
      transactionDate: o.createdAt.toISOString(),
      productType: o.items[0]?.ticketType.category ?? "-",
      nettAmount: asNumber(o.totalPayable),
      paymentDate: pay ? (pay.financePaidAt ?? pay.createdAt).toISOString() : null,
      paymentAmount: pay ? asNumber(pay.amount) : null,
      salesApprovedBy: pay?.adminApprovedByUserId
        ? approverNameById.get(pay.adminApprovedByUserId) ?? "-"
        : null,
      salesApprovedDate: pay?.adminApprovedAt ? pay.adminApprovedAt.toISOString() : null
    };
  });
};

/** Line-item level purchase report (Purchase Details / Transaction Details). */
export const purchaseDetailsReport = async (params: ReportParams) => {
  const items = await prisma.purchaseOrderItem.findMany({
    where: {
      purchaseOrder: {
        agentId: params.agentId,
        createdAt: rangeFilter(params.from, params.to)
      }
    },
    orderBy: { id: "desc" },
    include: {
      ticketType: { select: { name: true, category: true } },
      purchaseOrder: {
        include: { agent: { select: { companyName: true, accountCode: true } } }
      }
    }
  });

  return items.map((i) => ({
    username: i.purchaseOrder.agent.accountCode ?? "-",
    companyName: i.purchaseOrder.agent.companyName,
    reference: i.purchaseOrder.orderReference,
    transactionDate: i.purchaseOrder.createdAt.toISOString(),
    productType: i.ticketType.category,
    productName: i.ticketType.name,
    quantity: i.quantity,
    price: asNumber(i.unitPrice),
    nettAmount: asNumber(i.lineTotal),
    status: i.purchaseOrder.status
  }));
};

/** Most purchased products, grouped by party + product. */
export const topPurchaseReport = async (params: ReportParams & { limit?: number }) => {
  const items = await prisma.purchaseOrderItem.findMany({
    where: {
      purchaseOrder: {
        agentId: params.agentId,
        createdAt: rangeFilter(params.from, params.to)
      }
    },
    include: {
      ticketType: { select: { name: true, category: true } },
      purchaseOrder: {
        include: { agent: { select: { companyName: true, accountCode: true } } }
      }
    }
  });

  const groups = new Map<
    string,
    {
      username: string;
      companyName: string;
      productType: string;
      productName: string;
      itemQuantity: number;
      nettAmount: number;
    }
  >();

  for (const i of items) {
    const key = `${i.purchaseOrder.agentId}:${i.ticketTypeId}`;
    const existing = groups.get(key);
    if (existing) {
      existing.itemQuantity += i.quantity;
      existing.nettAmount += asNumber(i.lineTotal);
    } else {
      groups.set(key, {
        username: i.purchaseOrder.agent.accountCode ?? "-",
        companyName: i.purchaseOrder.agent.companyName,
        productType: i.ticketType.category,
        productName: i.ticketType.name,
        itemQuantity: i.quantity,
        nettAmount: asNumber(i.lineTotal)
      });
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => b.itemQuantity - a.itemQuantity)
    .slice(0, params.limit && params.limit > 0 ? params.limit : 10)
    .map((g) => ({ ...g, nettAmount: Number(g.nettAmount.toFixed(2)) }));
};

/** Ticket report: search a voucher by serial no or QR code. */
export const ticketReport = async (params: { serial?: string; qr?: string }) => {
  if (!params.serial && !params.qr) return [];

  const vouchers = await prisma.voucher.findMany({
    where: {
      OR: [
        params.serial ? { serialNo: { contains: params.serial, mode: "insensitive" } } : undefined,
        params.qr ? { qrToken: params.qr } : undefined
      ].filter(Boolean) as never
    },
    orderBy: { serialNo: "asc" },
    take: 100,
    include: {
      ticketType: { select: { name: true, category: true } },
      agent: { select: { companyName: true, accountCode: true } },
      purchaseOrder: { select: { orderReference: true } }
    }
  });

  return vouchers.map((v) => ({
    username: v.agent.accountCode ?? "-",
    companyName: v.agent.companyName,
    reference: v.purchaseOrder?.orderReference ?? "COMPLIMENTARY",
    serialNo: v.serialNo,
    effectiveDate: v.effectiveDate.toISOString(),
    expiryDate: v.expiryDate.toISOString(),
    productType: v.ticketType.category,
    productName: v.ticketType.name,
    usedQuantity: v.redeemStatus === "REDEEMED" ? 1 : 0,
    entryDate: v.redeemedAt?.toISOString() ?? null,
    status: v.redeemStatus
  }));
};

export const paymentReport = async (params: ReportParams) => {
  const payments = await prisma.offlinePayment.findMany({
    where: {
      agentId: params.agentId,
      createdAt: rangeFilter(params.from, params.to)
    },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      paymentType: { select: { name: true } },
      orderLinks: { include: { purchaseOrder: { select: { orderReference: true } } } }
    }
  });

  return payments.map((p) => ({
    username: p.agent.accountCode ?? "-",
    companyName: p.agent.companyName,
    reference: p.orderLinks[0]?.purchaseOrder.orderReference ?? "-",
    paymentDate: p.financePaidAt?.toISOString() ?? p.createdAt.toISOString(),
    paymentName: p.paymentType?.name ?? "Offline Transfer",
    paymentAmount: asNumber(p.amount),
    status: p.status
  }));
};

export const complimentaryReport = async (params: ReportParams) => {
  const grants = await prisma.complimentaryGrant.findMany({
    where: { agentId: params.agentId, createdAt: rangeFilter(params.from, params.to) },
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { companyName: true, accountCode: true } } }
  });
  return grants.map((g) => ({
    username: g.agent.accountCode ?? "-",
    companyName: g.agent.companyName,
    quantity: g.quantity,
    status: g.status,
    createdAt: g.createdAt.toISOString()
  }));
};

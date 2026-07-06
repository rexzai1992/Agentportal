import { endOfDay, startOfDay, subDays } from "date-fns";
import { prisma, asNumber } from "@backend/services/db";
import { Role } from "@shared/types/domain";

export type ReportRange = "today" | "7d" | "30d" | "custom";

export const resolveRange = (params: {
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const now = new Date();

  if (params.range === "custom" && params.from && params.to) {
    return {
      from: startOfDay(new Date(params.from)),
      to: endOfDay(new Date(params.to))
    };
  }

  if (params.range === "7d") {
    return {
      from: startOfDay(subDays(now, 6)),
      to: endOfDay(now)
    };
  }

  if (params.range === "30d") {
    return {
      from: startOfDay(subDays(now, 29)),
      to: endOfDay(now)
    };
  }

  return {
    from: startOfDay(now),
    to: endOfDay(now)
  };
};

const getScopedAgentId = (params: {
  role: Role;
  agentId?: string | null;
  filterAgentId?: string;
}) => {
  if (params.role === "AGENT") {
    if (!params.agentId) {
      throw new Error("Agent account mapping missing");
    }
    return params.agentId;
  }

  return params.filterAgentId;
};

const fetchBookingsWithAgents = async (params: {
  scopedAgentId?: string;
  from: Date;
  to: Date;
}) => {
  const where: any = {
    createdAt: {
      gte: params.from,
      lte: params.to
    }
  };

  if (params.scopedAgentId) {
    where.agentId = params.scopedAgentId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      agentId: true,
      createdAt: true,
      subtotal: true,
      totalCommission: true,
      totalPayable: true,
      totalTickets: true
    },
    orderBy: { createdAt: "asc" }
  });

  if (!bookings.length) {
    return [];
  }

  const agentIds = Array.from(new Set(bookings.map((booking) => booking.agentId)));
  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, companyName: true }
  });

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  return bookings.map((booking) => ({
    ...booking,
    agent: agentById.get(booking.agentId) ?? null
  }));
};

export const getSalesReport = async (params: {
  role: Role;
  agentId?: string | null;
  filterAgentId?: string;
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const { from, to } = resolveRange(params);
  const scopedAgentId = getScopedAgentId(params);

  const bookings = await fetchBookingsWithAgents({ scopedAgentId, from, to });

  const daily = new Map<string, { sales: number; commission: number; payable: number; tickets: number }>();

  for (const booking of bookings) {
    const dateKey = new Date(booking.createdAt).toISOString().slice(0, 10);
    const item = daily.get(dateKey) || { sales: 0, commission: 0, payable: 0, tickets: 0 };
    item.sales += asNumber(booking.subtotal);
    item.commission += asNumber(booking.totalCommission);
    item.payable += asNumber(booking.totalPayable);
    item.tickets += booking.totalTickets;
    daily.set(dateKey, item);
  }

  return {
    range: { from, to },
    totals: bookings.reduce(
      (acc, booking) => {
        acc.sales += asNumber(booking.subtotal);
        acc.commission += asNumber(booking.totalCommission);
        acc.payable += asNumber(booking.totalPayable);
        acc.tickets += booking.totalTickets;
        return acc;
      },
      { sales: 0, commission: 0, payable: 0, tickets: 0 }
    ),
    daily: Array.from(daily.entries()).map(([date, value]) => ({ date, ...value }))
  };
};

export const getCommissionReport = async (params: {
  role: Role;
  agentId?: string | null;
  filterAgentId?: string;
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const { from, to } = resolveRange(params);
  const scopedAgentId = getScopedAgentId(params);

  const bookings = await fetchBookingsWithAgents({ scopedAgentId, from, to });

  const byAgent = new Map<string, { agentName: string; commission: number; sales: number }>();

  for (const booking of bookings) {
    const item = byAgent.get(booking.agentId) || {
      agentName: booking.agent?.companyName ?? "Unknown Agent",
      commission: 0,
      sales: 0
    };

    item.commission += asNumber(booking.totalCommission);
    item.sales += asNumber(booking.subtotal);
    byAgent.set(booking.agentId, item);
  }

  return {
    range: { from, to },
    byAgent: Array.from(byAgent.entries()).map(([agentId, value]) => ({ agentId, ...value }))
  };
};

export const getUsageReport = async (params: {
  role: Role;
  agentId?: string | null;
  filterAgentId?: string;
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const { from, to } = resolveRange(params);
  const scopedAgentId = getScopedAgentId(params);

  let scopedBookingIds: string[] | null = null;
  if (scopedAgentId) {
    const bookings = await prisma.booking.findMany({
      where: {
        agentId: scopedAgentId,
        // Restrict to the report window to avoid scanning unrelated bookings.
        createdAt: {
          gte: from,
          lte: to
        }
      },
      select: { id: true }
    });

    scopedBookingIds = bookings.map((booking) => booking.id);
    if (!scopedBookingIds.length) {
      return {
        range: { from, to },
        total: 0,
        byStatus: {}
      };
    }
  }

  const ticketWhere: any = {
    createdAt: {
      gte: from,
      lte: to
    }
  };

  if (scopedBookingIds) {
    ticketWhere.bookingId = { in: scopedBookingIds };
  }

  const tickets = await prisma.ticket.findMany({
    where: ticketWhere,
    select: { id: true, status: true }
  });

  const byStatus = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    range: { from, to },
    total: tickets.length,
    byStatus
  };
};

export const getInvoiceReport = async (params: {
  role: Role;
  agentId?: string | null;
  filterAgentId?: string;
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const { from, to } = resolveRange(params);
  const scopedAgentId = getScopedAgentId(params);

  const where: any = {
    createdAt: {
      gte: from,
      lte: to
    }
  };

  if (scopedAgentId) {
    where.agentId = scopedAgentId;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      id: true,
      agentId: true,
      invoiceNumber: true,
      invoiceType: true,
      periodStart: true,
      periodEnd: true,
      totalSales: true,
      totalCommission: true,
      totalPayable: true,
      status: true,
      dueDate: true,
      paidAt: true,
      createdAt: true
    }
  });

  const agentIds = Array.from(new Set(invoices.map((invoice) => invoice.agentId)));

  const agents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, companyName: true }
      })
    : [];

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  return {
    range: { from, to },
    invoices: invoices.map((invoice) => ({
      ...invoice,
      totalSales: asNumber(invoice.totalSales),
      totalCommission: asNumber(invoice.totalCommission),
      totalPayable: asNumber(invoice.totalPayable),
      agent: agentById.get(invoice.agentId) ?? null
    }))
  };
};

export const getAgentPerformanceReport = async (params: {
  range?: ReportRange;
  from?: string;
  to?: string;
}) => {
  const { from, to } = resolveRange(params);
  const bookings = await fetchBookingsWithAgents({ from, to });

  const byAgent = new Map<
    string,
    {
      agentName: string;
      totalSales: number;
      totalCommission: number;
      totalTickets: number;
      bookings: number;
    }
  >();

  for (const booking of bookings) {
    const item = byAgent.get(booking.agentId) || {
      agentName: booking.agent?.companyName ?? "Unknown Agent",
      totalSales: 0,
      totalCommission: 0,
      totalTickets: 0,
      bookings: 0
    };

    item.totalSales += asNumber(booking.subtotal);
    item.totalCommission += asNumber(booking.totalCommission);
    item.totalTickets += booking.totalTickets;
    item.bookings += 1;

    byAgent.set(booking.agentId, item);
  }

  return {
    range: { from, to },
    agents: Array.from(byAgent.entries()).map(([agentId, value]) => ({ agentId, ...value }))
  };
};

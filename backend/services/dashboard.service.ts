import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import { prisma, asNumber } from "@backend/services/db";
import { AgreementType } from "@shared/types/domain";

const getNextInvoiceDate = (agreementType: AgreementType, cycleStart: Date): Date | null => {
  if (agreementType === "PREPAID") {
    return null;
  }

  const cycleDays = agreementType === "WEEKLY" ? 7 : 30;
  const today = startOfDay(new Date());
  const start = startOfDay(cycleStart);
  if (today <= start) {
    return addDays(start, cycleDays);
  }

  const elapsed = differenceInCalendarDays(today, start);
  const passed = Math.floor(elapsed / cycleDays);
  return addDays(start, (passed + 1) * cycleDays);
};

export const getAdminDashboardData = async () => {
  const fromDate = subDays(new Date(), 120);

  const [bookings, tickets, activeAgentsCount] = await Promise.all([
    prisma.booking.findMany({
      select: { agentId: true, createdAt: true, subtotal: true, totalPayable: true },
      where: { createdAt: { gte: fromDate } }
    }),
    prisma.ticket.findMany({
      select: { checkedInAt: true },
      where: { createdAt: { gte: fromDate } }
    }),
    prisma.agent.count({ where: { isActive: true } })
  ]);

  const agentIds = Array.from(new Set(bookings.map((booking) => booking.agentId)));
  const agents = agentIds.length
    ? await prisma.agent.findMany({
        select: { id: true, companyName: true },
        where: { id: { in: agentIds } }
      })
    : [];

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));

  const today = new Date();
  const ticketsUsedToday = tickets.filter((ticket) => {
    if (!ticket.checkedInAt) return false;
    const checkedInDate = new Date(ticket.checkedInAt);
    return (
      checkedInDate.getDate() === today.getDate() &&
      checkedInDate.getMonth() === today.getMonth() &&
      checkedInDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const totalRevenue = bookings.reduce((sum, booking) => sum + asNumber(booking.totalPayable), 0);

  const dailySalesMap = new Map<string, number>();
  const monthlyRevenueMap = new Map<string, number>();
  const agentSalesMap = new Map<string, number>();
  const usageByDay = new Map<string, number>();

  for (const booking of bookings) {
    const createdAt = new Date(booking.createdAt);
    const day = format(createdAt, "yyyy-MM-dd");
    const month = format(createdAt, "yyyy-MM");

    dailySalesMap.set(day, (dailySalesMap.get(day) || 0) + asNumber(booking.subtotal));
    monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + asNumber(booking.totalPayable));

    const agentName = agentById.get(booking.agentId)?.companyName ?? "Unknown Agent";
    agentSalesMap.set(agentName, (agentSalesMap.get(agentName) || 0) + asNumber(booking.subtotal));
  }

  for (const ticket of tickets) {
    if (!ticket.checkedInAt) continue;
    const day = format(new Date(ticket.checkedInAt), "yyyy-MM-dd");
    usageByDay.set(day, (usageByDay.get(day) || 0) + 1);
  }

  return {
    summary: {
      totalRevenue,
      totalTicketsSold: tickets.length,
      ticketsUsedToday,
      activeAgents: activeAgentsCount ?? 0
    },
    charts: {
      dailySales: Array.from(dailySalesMap.entries())
        .map(([date, sales]) => ({ date, sales }))
        .slice(-14),
      monthlyRevenue: Array.from(monthlyRevenueMap.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-12),
      topAgents: Array.from(agentSalesMap.entries())
        .map(([agent, sales]) => ({ agent, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      usageByDay: Array.from(usageByDay.entries())
        .map(([date, used]) => ({ date, used }))
        .slice(-14)
    }
  };
};

export const getAgentDashboardData = async (agentId: string) => {
  const [agent, recentBookingRows, allBookings, bookingStats] = await Promise.all([
    prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        agreementType: true,
        creditBalance: true,
        outstandingBalance: true,
        billingCycleStartDate: true
      }
    }),
    prisma.booking.findMany({
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        totalPayable: true,
        totalTickets: true,
        createdAt: true
      },
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.booking.findMany({
      select: { id: true, bookingReference: true, customerName: true },
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.booking.findMany({
      select: { totalTickets: true, totalCommission: true, createdAt: true },
      where: { agentId }
    })
  ]);

  if (!agent) {
    throw new Error("Agent not found");
  }

  const recentBookings = recentBookingRows.map((booking) => ({
    ...booking,
    totalPayable: asNumber(booking.totalPayable)
  }));

  const bookingLookup = new Map(allBookings.map((booking) => [booking.id, booking]));
  const allBookingIds = Array.from(bookingLookup.keys());

  const recentTicketRows = allBookingIds.length
    ? await prisma.ticket.findMany({
        select: {
          id: true,
          bookingId: true,
          ticketTypeId: true,
          ticketCode: true,
          status: true,
          visitDate: true,
          createdAt: true
        },
        where: { bookingId: { in: allBookingIds } },
        orderBy: { createdAt: "desc" },
        take: 12
      })
    : [];

  const ticketTypeIds = Array.from(new Set(recentTicketRows.map((ticket) => ticket.ticketTypeId)));

  const ticketTypes = ticketTypeIds.length
    ? await prisma.ticketType.findMany({
        select: { id: true, name: true },
        where: { id: { in: ticketTypeIds } }
      })
    : [];

  const ticketTypeById = new Map(ticketTypes.map((ticketType) => [ticketType.id, ticketType]));

  const recentTickets = recentTicketRows.map((ticket) => ({
    ...ticket,
    booking: bookingLookup.get(ticket.bookingId) ?? null,
    ticketType: ticketTypeById.get(ticket.ticketTypeId) ?? null
  }));

  const today = new Date();
  const ticketsSoldToday = bookingStats
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return (
        createdAt.getDate() === today.getDate() &&
        createdAt.getMonth() === today.getMonth() &&
        createdAt.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, booking) => sum + booking.totalTickets, 0);

  const commissionEarned = bookingStats.reduce(
    (sum, booking) => sum + asNumber(booking.totalCommission),
    0
  );

  const lowBalanceWarning =
    agent.agreementType === "PREPAID" && asNumber(agent.creditBalance) <= 100 ? true : false;

  return {
    agent: {
      ...agent,
      creditBalance: asNumber(agent.creditBalance),
      outstandingBalance: asNumber(agent.outstandingBalance)
    },
    agreementType: agent.agreementType,
    stats: {
      creditBalance: asNumber(agent.creditBalance),
      outstandingBalance: asNumber(agent.outstandingBalance),
      ticketsSoldToday,
      totalTicketsSold: bookingStats.reduce((sum, booking) => sum + booking.totalTickets, 0),
      commissionEarned,
      lowBalanceWarning,
      nextInvoiceDate: getNextInvoiceDate(
        agent.agreementType as AgreementType,
        new Date(agent.billingCycleStartDate)
      )
    },
    recentBookings,
    recentTickets
  };
};

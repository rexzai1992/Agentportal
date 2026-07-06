import crypto from "node:crypto";
import { logActivity } from "@backend/services/activity.service";
import { prisma, asNumber, toMoney } from "@backend/services/db";
import { BookingPaymentStatus, Role } from "@shared/types/domain";

const generateBookingReference = (): string =>
  `TA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

const generateTicketCode = (bookingRef: string, sequence: number): string =>
  `${bookingRef}-${String(sequence).padStart(3, "0")}`;

export interface BookingItemInput {
  ticketTypeId: string;
  quantity: number;
}

export interface CreateBookingInput {
  agentId: string;
  customerName: string;
  customerPhone?: string;
  visitDate: string;
  items: BookingItemInput[];
  createdByUserId: string;
}

const hydrateBookings = async (bookings: any[]) => {
  if (!bookings.length) {
    return [];
  }

  const bookingIds = bookings.map((booking) => booking.id);
  const agentIds = Array.from(new Set(bookings.map((booking) => booking.agentId)));

  const [agents, tickets] = await Promise.all([
    prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, companyName: true }
    }),
    prisma.ticket.findMany({
      where: { bookingId: { in: bookingIds } },
      select: {
        id: true,
        bookingId: true,
        ticketTypeId: true,
        ticketCode: true,
        status: true,
        visitDate: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const ticketTypeIds = Array.from(new Set(tickets.map((ticket) => ticket.ticketTypeId)));
  const ticketTypes = ticketTypeIds.length
    ? await prisma.ticketType.findMany({
        where: { id: { in: ticketTypeIds } },
        select: { id: true, name: true }
      })
    : [];

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const ticketTypeById = new Map(ticketTypes.map((type) => [type.id, type]));

  const ticketsByBookingId = new Map<string, any[]>();
  for (const ticket of tickets) {
    const hydratedTicket = {
      ...ticket,
      ticketType: ticketTypeById.get(ticket.ticketTypeId) ?? null
    };

    const arr = ticketsByBookingId.get(ticket.bookingId) ?? [];
    arr.push(hydratedTicket);
    ticketsByBookingId.set(ticket.bookingId, arr);
  }

  return bookings.map((booking) => ({
    ...booking,
    subtotal: asNumber(booking.subtotal),
    totalCommission: asNumber(booking.totalCommission),
    totalPayable: asNumber(booking.totalPayable),
    agent: agentById.get(booking.agentId) ?? null,
    tickets: ticketsByBookingId.get(booking.id) ?? []
  }));
};

export const createBooking = async (input: CreateBookingInput) => {
  if (!input.items.length) {
    throw new Error("At least one ticket item is required");
  }

  const visitDate = new Date(input.visitDate);
  if (Number.isNaN(visitDate.getTime())) {
    throw new Error("Invalid visit date");
  }

  const agent = await prisma.agent.findUnique({
    where: { id: input.agentId },
    select: {
      id: true,
      isActive: true,
      agreementType: true,
      creditBalance: true,
      outstandingBalance: true,
      creditLimit: true
    }
  });

  if (!agent || !agent.isActive) {
    throw new Error("Agent is inactive or not found");
  }

  const ticketTypeIds = input.items.map((item) => item.ticketTypeId);
  const uniqueTicketTypeIds = Array.from(new Set(ticketTypeIds));

  const ticketTypes = await prisma.ticketType.findMany({
    where: { id: { in: uniqueTicketTypeIds }, active: true },
    select: { id: true, sellingPrice: true, commissionRate: true, active: true }
  });

  if (!ticketTypes || ticketTypes.length !== uniqueTicketTypeIds.length) {
    throw new Error("One or more ticket types are invalid");
  }

  let subtotal = 0;
  let totalCommission = 0;
  let totalTickets = 0;

  for (const item of input.items) {
    if (item.quantity <= 0) {
      throw new Error("Ticket quantity must be at least 1");
    }

    const ticketType = ticketTypes.find((type) => type.id === item.ticketTypeId);
    if (!ticketType) {
      throw new Error(`Ticket type ${item.ticketTypeId} missing`);
    }

    const unitPrice = asNumber(ticketType.sellingPrice);
    const commissionRate = asNumber(ticketType.commissionRate);
    const lineSubtotal = unitPrice * item.quantity;
    const lineCommission = (lineSubtotal * commissionRate) / 100;

    subtotal += lineSubtotal;
    totalCommission += lineCommission;
    totalTickets += item.quantity;
  }

  subtotal = toMoney(subtotal);
  totalCommission = toMoney(totalCommission);
  const totalPayable = toMoney(subtotal - totalCommission);

  if (agent.agreementType === "PREPAID") {
    const available = asNumber(agent.creditBalance);
    if (available < totalPayable) {
      throw new Error("Insufficient prepaid credit balance");
    }
  }

  if (agent.agreementType !== "PREPAID" && agent.creditLimit) {
    const limit = asNumber(agent.creditLimit);
    const outstanding = asNumber(agent.outstandingBalance);
    if (outstanding + totalPayable > limit) {
      throw new Error("Credit limit exceeded");
    }
  }

  const bookingReference = generateBookingReference();
  const paymentStatus: BookingPaymentStatus =
    agent.agreementType === "PREPAID" ? "PREPAID_PAID" : "UNBILLED";

  const booking = await prisma.booking.create({
    data: {
      agentId: agent.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone || null,
      bookingReference,
      totalTickets,
      subtotal,
      totalCommission,
      totalPayable,
      paymentStatus,
      createdByUserId: input.createdByUserId
    }
  });

  const ticketsData: Array<{
    bookingId: string;
    ticketTypeId: string;
    ticketCode: string;
    qrToken: string;
    visitDate: string;
  }> = [];

  let sequence = 1;
  for (const item of input.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      ticketsData.push({
        bookingId: booking.id,
        ticketTypeId: item.ticketTypeId,
        ticketCode: generateTicketCode(bookingReference, sequence),
        qrToken: crypto.randomUUID(),
        visitDate: visitDate.toISOString()
      });
      sequence += 1;
    }
  }

  await prisma.ticket.createMany({ data: ticketsData });

  if (agent.agreementType === "PREPAID") {
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        creditBalance: toMoney(asNumber(agent.creditBalance) - totalPayable)
      }
    });
  } else {
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        outstandingBalance: toMoney(asNumber(agent.outstandingBalance) + totalPayable)
      }
    });
  }

  await logActivity({
    userId: input.createdByUserId,
    action: "BOOKING_CREATED",
    entityType: "BOOKING",
    entityId: booking.id,
    description: `Created booking ${bookingReference}`
  });

  const hydrated = await hydrateBookings([booking]);
  return hydrated[0];
};

export const listBookings = async (params: {
  role: Role;
  agentId?: string | null;
  bookingReference?: string;
  limit?: number;
}) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 200, 1), 500);

  if (params.role === "AGENT" && !params.agentId) {
    return [];
  }

  const where: any = {};

  if (params.role === "AGENT" && params.agentId) {
    where.agentId = params.agentId;
  }

  if (params.bookingReference) {
    where.bookingReference = { contains: params.bookingReference };
  }

  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      agentId: true,
      customerName: true,
      customerPhone: true,
      bookingReference: true,
      totalTickets: true,
      subtotal: true,
      totalCommission: true,
      totalPayable: true,
      paymentStatus: true,
      invoiceId: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: safeLimit
  });

  return hydrateBookings(bookings ?? []);
};

export const getBookingById = async (
  id: string,
  context: { role: Role; agentId?: string | null }
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      agentId: true,
      customerName: true,
      customerPhone: true,
      bookingReference: true,
      totalTickets: true,
      subtotal: true,
      totalCommission: true,
      totalPayable: true,
      paymentStatus: true,
      invoiceId: true,
      createdAt: true
    }
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (context.role === "AGENT" && booking.agentId !== context.agentId) {
    throw new Error("Forbidden");
  }

  const hydrated = await hydrateBookings([booking]);
  return hydrated[0];
};

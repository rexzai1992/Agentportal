import QRCode from "qrcode";
import { logActivity } from "@backend/services/activity.service";
import { signQrPayload, verifyQrPayloadSignature } from "@backend/services/token.service";
import { prisma } from "@backend/services/db";
import { Role, TicketStatus } from "@shared/types/domain";

export interface TicketValidationInput {
  ticketId: string;
  qrToken: string;
  signature: string;
  ts: number;
}

export interface TicketQrPayload {
  ticketId: string;
  qrToken: string;
  signature: string;
  ts: number;
}

const toDate = (value: string | Date): Date =>
  value instanceof Date ? value : new Date(value);

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isPastDay = (visitDate: Date, now: Date): boolean => {
  const visit = new Date(visitDate);
  visit.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return visit.getTime() < today.getTime();
};

const hydrateTickets = async (tickets: any[]) => {
  if (!tickets.length) {
    return [];
  }

  const bookingIds = Array.from(new Set(tickets.map((ticket) => ticket.bookingId)));
  const ticketTypeIds = Array.from(new Set(tickets.map((ticket) => ticket.ticketTypeId)));

  const [bookings, ticketTypes] = await Promise.all([
    prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      select: {
        id: true,
        agentId: true,
        bookingReference: true,
        customerName: true,
        customerPhone: true,
        createdAt: true
      }
    }),
    prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } },
      select: { id: true, name: true }
    })
  ]);

  const agentIds = Array.from(new Set(bookings.map((booking) => booking.agentId)));

  const agents = agentIds.length
    ? await prisma.agent.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, companyName: true }
      })
    : [];

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const bookingById = new Map(
    bookings.map((booking) => [booking.id, { ...booking, agent: agentById.get(booking.agentId) ?? null }])
  );
  const ticketTypeById = new Map(ticketTypes.map((ticketType) => [ticketType.id, ticketType]));

  return tickets.map((ticket) => ({
    ...ticket,
    ticketType: ticketTypeById.get(ticket.ticketTypeId) ?? null,
    booking: bookingById.get(ticket.bookingId) ?? null
  }));
};

const getTicketWithRelations = async (ticketId: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      bookingId: true,
      ticketTypeId: true,
      ticketCode: true,
      qrToken: true,
      visitDate: true,
      status: true,
      checkedInAt: true,
      checkedInBy: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!ticket) {
    return null;
  }

  const hydrated = await hydrateTickets([ticket]);
  return hydrated[0] ?? null;
};

export const listTickets = async (params: {
  role: Role;
  agentId?: string | null;
  status?: TicketStatus;
  bookingReference?: string;
  limit?: number;
}) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 200, 1), 500);

  if (params.role === "AGENT" && !params.agentId) {
    return [];
  }

  let scopedBookingIds: string[] | null = null;
  if (params.role === "AGENT" || params.bookingReference) {
    const bookingWhere: any = {};

    if (params.role === "AGENT" && params.agentId) {
      bookingWhere.agentId = params.agentId;
    }

    if (params.bookingReference) {
      bookingWhere.bookingReference = { contains: params.bookingReference };
    }

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: { id: true }
    });

    scopedBookingIds = bookings.map((booking) => booking.id);
    if (!scopedBookingIds.length) {
      return [];
    }
  }

  const ticketWhere: any = {};

  if (params.status) {
    ticketWhere.status = params.status;
  }

  if (scopedBookingIds) {
    ticketWhere.bookingId = { in: scopedBookingIds };
  }

  const tickets = await prisma.ticket.findMany({
    where: ticketWhere,
    select: {
      id: true,
      bookingId: true,
      ticketTypeId: true,
      ticketCode: true,
      visitDate: true,
      status: true,
      checkedInAt: true,
      checkedInBy: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: safeLimit
  });

  return hydrateTickets(tickets ?? []);
};

export const getTicketById = async (
  id: string,
  context: { role: Role; agentId?: string | null }
) => {
  const ticket = await getTicketWithRelations(id);

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (context.role === "AGENT" && ticket.booking?.agentId !== context.agentId) {
    throw new Error("Forbidden");
  }

  return ticket;
};

const toQrDataUrl = async (payload: TicketQrPayload): Promise<string> =>
  QRCode.toDataURL(JSON.stringify(payload), {
    margin: 1,
    width: 360,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF"
    }
  });

export const generateTicketQrPayload = async (ticketId: string): Promise<TicketQrPayload> => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, qrToken: true }
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const ts = Date.now();
  const signature = signQrPayload({
    ticketId: ticket.id,
    qrToken: ticket.qrToken,
    ts
  });

  return {
    ticketId: ticket.id,
    qrToken: ticket.qrToken,
    ts,
    signature
  };
};

export const generateTicketQrDataUrl = async (ticketId: string): Promise<string> => {
  const payload = await generateTicketQrPayload(ticketId);
  return toQrDataUrl(payload);
};

export const generateTicketQrDataUrlFromPayload = async (payload: TicketQrPayload): Promise<string> =>
  toQrDataUrl(payload);

export const validateTicketScan = async (params: {
  input: TicketValidationInput;
  staffUserId: string;
  checkedInAt?: string;
}) => {
  const { input } = params;

  const signatureValid = verifyQrPayloadSignature({
    ticketId: input.ticketId,
    qrToken: input.qrToken,
    ts: input.ts,
    signature: input.signature
  });

  if (!signatureValid) {
    return {
      result: "INVALID",
      message: "Invalid QR signature"
    } as const;
  }

  const ticket = await getTicketWithRelations(input.ticketId);

  if (!ticket || ticket.qrToken !== input.qrToken) {
    return {
      result: "INVALID",
      message: "Ticket not found"
    } as const;
  }

  if (ticket.status === "USED") {
    return {
      result: "ALREADY_USED",
      message: "Ticket was already checked in",
      checkedInAt: ticket.checkedInAt,
      ticket
    } as const;
  }

  if (ticket.status !== "ACTIVE") {
    return {
      result: "INVALID",
      message: `Ticket is ${ticket.status}`,
      ticket
    } as const;
  }

  const now = params.checkedInAt ? new Date(params.checkedInAt) : new Date();
  const visitDate = toDate(ticket.visitDate);

  if (!isSameDay(visitDate, now)) {
    if (isPastDay(visitDate, now)) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "EXPIRED" }
      });
    }

    return {
      result: "EXPIRED",
      message: "Ticket visit date is not valid for today",
      ticket
    } as const;
  }

  const checkedInAt = now.toISOString();
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "USED",
      checkedInAt,
      checkedInBy: params.staffUserId
    }
  });

  const updated = await getTicketWithRelations(ticket.id);

  await logActivity({
    userId: params.staffUserId,
    action: "TICKET_CHECKIN",
    entityType: "TICKET",
    entityId: ticket.id,
    description: `Checked in ticket ${ticket.ticketCode}`
  });

  return {
    result: "VALID",
    message: "Ticket check-in successful",
    checkedInAt: updated?.checkedInAt ?? checkedInAt,
    ticket: updated
  } as const;
};

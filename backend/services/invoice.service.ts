import { addDays, format } from "date-fns";
import { logActivity } from "@backend/services/activity.service";
import { prisma, asNumber, toMoney } from "@backend/services/db";
import { InvoiceStatus, Role } from "@shared/types/domain";

const invoiceNumber = (): string =>
  `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

const cycleDaysForAgent = (agreementType: "PREPAID" | "WEEKLY" | "MONTHLY"): number =>
  agreementType === "WEEKLY" ? 7 : 30;

const hydrateInvoices = async (invoices: any[]) => {
  if (!invoices.length) {
    return [];
  }

  const agentIds = Array.from(new Set(invoices.map((invoice) => invoice.agentId)));
  const invoiceIds = invoices.map((invoice) => invoice.id);

  const [agents, bookings] = await Promise.all([
    prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, companyName: true }
    }),
    prisma.booking.findMany({
      where: { invoiceId: { in: invoiceIds } },
      select: {
        id: true,
        invoiceId: true,
        bookingReference: true,
        customerName: true,
        totalPayable: true,
        createdAt: true
      }
    })
  ]);

  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const bookingsByInvoiceId = new Map<string, any[]>();

  for (const booking of bookings) {
    if (!booking.invoiceId) continue;
    const arr = bookingsByInvoiceId.get(booking.invoiceId) ?? [];
    arr.push({ ...booking, totalPayable: asNumber(booking.totalPayable) });
    bookingsByInvoiceId.set(booking.invoiceId, arr);
  }

  return invoices.map((invoice) => ({
    ...invoice,
    totalSales: asNumber(invoice.totalSales),
    totalCommission: asNumber(invoice.totalCommission),
    totalPayable: asNumber(invoice.totalPayable),
    agent: agentById.get(invoice.agentId) ?? null,
    bookings: bookingsByInvoiceId.get(invoice.id) ?? []
  }));
};

export const listInvoices = async (params: {
  role: Role;
  agentId?: string | null;
  status?: InvoiceStatus;
}) => {
  await prisma.invoice.updateMany({
    where: {
      status: "ISSUED",
      dueDate: { lt: new Date() }
    },
    data: { status: "OVERDUE" }
  });

  const where: any = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.role === "AGENT") {
    if (!params.agentId) {
      return [];
    }

    where.agentId = params.agentId;
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
    },
    orderBy: { createdAt: "desc" }
  });

  return hydrateInvoices(invoices);
};

export const generateInvoices = async (params: {
  initiatedBy: string;
  agentId?: string;
}) => {
  const now = new Date();

  const agentWhere: any = {
    isActive: true,
    agreementType: { in: ["WEEKLY", "MONTHLY"] }
  };

  if (params.agentId) {
    agentWhere.id = params.agentId;
  }

  const agents = await prisma.agent.findMany({ where: agentWhere });

  const createdInvoiceIds: string[] = [];

  for (const agent of agents) {
    const cycleDays = cycleDaysForAgent(agent.agreementType);

    const latest = await prisma.invoice.findFirst({
      where: { agentId: agent.id },
      select: { id: true, periodEnd: true },
      orderBy: { periodEnd: "desc" }
    });

    let periodStart = latest ? addDays(new Date(latest.periodEnd), 1) : new Date(agent.billingCycleStartDate);

    while (true) {
      const periodEnd = addDays(periodStart, cycleDays - 1);
      if (periodEnd > now) {
        break;
      }

      const bookings = await prisma.booking.findMany({
        where: {
          agentId: agent.id,
          paymentStatus: "UNBILLED",
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        select: {
          id: true,
          subtotal: true,
          totalCommission: true,
          totalPayable: true
        }
      });

      if (bookings.length > 0) {
        const totals = bookings.reduce(
          (acc, booking) => {
            acc.sales += asNumber(booking.subtotal);
            acc.commission += asNumber(booking.totalCommission);
            acc.payable += asNumber(booking.totalPayable);
            return acc;
          },
          { sales: 0, commission: 0, payable: 0 }
        );

        const createdInvoice = await prisma.invoice.create({
          data: {
            agentId: agent.id,
            invoiceNumber: invoiceNumber(),
            invoiceType: agent.agreementType as any,
            periodStart,
            periodEnd,
            totalSales: toMoney(totals.sales),
            totalCommission: toMoney(totals.commission),
            totalPayable: toMoney(totals.payable),
            status: "ISSUED",
            dueDate: addDays(periodEnd, 14)
          }
        });

        if (!createdInvoice) {
          throw new Error("Failed to create invoice");
        }

        const bookingIds = bookings.map((booking) => booking.id);
        await prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: {
            invoiceId: createdInvoice.id,
            paymentStatus: "INVOICED"
          }
        });

        createdInvoiceIds.push(createdInvoice.id);
      }

      periodStart = addDays(periodEnd, 1);
    }
  }

  if (createdInvoiceIds.length > 0) {
    await logActivity({
      userId: params.initiatedBy,
      action: "INVOICES_GENERATED",
      entityType: "INVOICE",
      entityId: createdInvoiceIds.join(","),
      description: `Generated ${createdInvoiceIds.length} invoice(s)`
    });
  }

  if (!createdInvoiceIds.length) {
    return [];
  }

  const createdInvoices = await prisma.invoice.findMany({
    where: { id: { in: createdInvoiceIds } }
  });

  return hydrateInvoices(createdInvoices);
};

export const markInvoicePaid = async (params: { id: string; paidByUserId: string }) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "PAID") {
    const hydrated = await hydrateInvoices([invoice]);
    return hydrated[0];
  }

  const agent = await prisma.agent.findUnique({
    where: { id: invoice.agentId },
    select: { id: true, outstandingBalance: true }
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const payable = asNumber(invoice.totalPayable);
  const outstanding = asNumber(agent.outstandingBalance);
  const nextOutstanding = Math.max(0, outstanding - payable);

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: new Date()
    }
  });

  await prisma.booking.updateMany({
    where: { invoiceId: invoice.id },
    data: { paymentStatus: "PAID" }
  });

  await prisma.agent.update({
    where: { id: invoice.agentId },
    data: { outstandingBalance: toMoney(nextOutstanding) }
  });

  await logActivity({
    userId: params.paidByUserId,
    action: "INVOICE_MARKED_PAID",
    entityType: "INVOICE",
    entityId: invoice.id,
    description: `Invoice ${invoice.invoiceNumber} marked as paid`
  });

  const updatedInvoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoice.id }
  });

  const hydrated = await hydrateInvoices([updatedInvoice]);
  return hydrated[0];
};

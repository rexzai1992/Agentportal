import { logActivity } from "@backend/services/activity.service";
import { asNumber, prisma, toMoney } from "@backend/services/db";
import { AgreementType } from "@shared/types/domain";

const assertCommissionRate = (value: number): void => {
  if (value < 0 || value > 100) {
    throw new Error("Commission cannot exceed 100%");
  }
};

const serializeAgent = <T extends {
  commissionRate: { toString(): string };
  creditBalance: { toString(): string };
  outstandingBalance: { toString(): string };
  creditLimit: { toString(): string } | null;
}>(agent: T) => ({
  ...agent,
  commissionRate: asNumber(agent.commissionRate),
  creditBalance: asNumber(agent.creditBalance),
  outstandingBalance: asNumber(agent.outstandingBalance),
  creditLimit: agent.creditLimit === null ? null : asNumber(agent.creditLimit)
});

export interface CreateAgentInput {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  agreementType: AgreementType;
  commissionRate: number;
  creditLimit?: number | null;
  initialBalance?: number | null;
  billingCycleStartDate?: string;
}

export interface UpdateAgentInput {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  agreementType?: AgreementType;
  commissionRate?: number;
  creditLimit?: number | null;
  isActive?: boolean;
}

export const listAgents = async (params?: { agentId?: string | null }) => {
  if (params && !params.agentId) {
    return [];
  }

  const agents = await prisma.agent.findMany({
    where: params?.agentId ? { id: params.agentId } : undefined,
    select: {
      id: true,
      companyName: true,
      contactName: true,
      phone: true,
      email: true,
      agreementType: true,
      commissionRate: true,
      creditBalance: true,
      outstandingBalance: true,
      creditLimit: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  if (!agents || agents.length === 0) {
    return [];
  }

  const bookingCountByAgent = new Map<string, number>();
  const invoiceCountByAgent = new Map<string, number>();

  if (agents.length === 1) {
    const agentId = agents[0].id;
    const [bookingsCount, invoicesCount] = await Promise.all([
      prisma.booking.count({ where: { agentId } }),
      prisma.invoice.count({ where: { agentId } })
    ]);

    bookingCountByAgent.set(agentId, bookingsCount ?? 0);
    invoiceCountByAgent.set(agentId, invoicesCount ?? 0);
  } else {
    const agentIds = agents.map((agent) => agent.id);
    const [bookingRows, invoiceRows] = await Promise.all([
      prisma.booking.findMany({ where: { agentId: { in: agentIds } }, select: { agentId: true } }),
      prisma.invoice.findMany({ where: { agentId: { in: agentIds } }, select: { agentId: true } })
    ]);

    for (const row of bookingRows ?? []) {
      bookingCountByAgent.set(row.agentId, (bookingCountByAgent.get(row.agentId) ?? 0) + 1);
    }

    for (const row of invoiceRows ?? []) {
      invoiceCountByAgent.set(row.agentId, (invoiceCountByAgent.get(row.agentId) ?? 0) + 1);
    }
  }

  return agents.map((agent) => ({
    ...serializeAgent(agent),
    _count: {
      bookings: bookingCountByAgent.get(agent.id) ?? 0,
      invoices: invoiceCountByAgent.get(agent.id) ?? 0
    }
  }));
};

export const createAgent = async (input: CreateAgentInput, adminUserId: string) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!input.phone?.trim()) {
    throw new Error("Phone number is required");
  }

  assertCommissionRate(input.commissionRate);

  const existing = await prisma.agent.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existing) {
    throw new Error("Agent email must be unique");
  }

  const created = await prisma.agent.create({
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      phone: input.phone,
      email: normalizedEmail,
      agreementType: input.agreementType,
      commissionRate: toMoney(input.commissionRate),
      creditLimit:
        input.creditLimit === null || input.creditLimit === undefined
          ? null
          : toMoney(input.creditLimit),
      creditBalance: input.agreementType === "PREPAID" ? toMoney(input.initialBalance ?? 0) : 0,
      outstandingBalance: 0,
      billingCycleStartDate: input.billingCycleStartDate
        ? new Date(input.billingCycleStartDate)
        : new Date()
    }
  });

  await logActivity({
    userId: adminUserId,
    action: "AGENT_CREATED",
    entityType: "AGENT",
    entityId: created.id,
    description: `Created agent ${created.companyName}`
  });

  return serializeAgent(created);
};

export const updateAgent = async (id: string, input: UpdateAgentInput, adminUserId: string) => {
  if (input.commissionRate !== undefined) {
    assertCommissionRate(input.commissionRate);
  }

  if (input.email) {
    const normalizedEmail = input.email.toLowerCase();

    const existing = await prisma.agent.findFirst({
      where: { email: normalizedEmail, id: { not: id } },
      select: { id: true }
    });

    if (existing) {
      throw new Error("Agent email must be unique");
    }
  }

  const updatePayload: Record<string, unknown> = {};

  if (input.companyName !== undefined) updatePayload.companyName = input.companyName;
  if (input.contactName !== undefined) updatePayload.contactName = input.contactName;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.email !== undefined) updatePayload.email = input.email.toLowerCase();
  if (input.agreementType !== undefined) updatePayload.agreementType = input.agreementType;
  if (input.commissionRate !== undefined) updatePayload.commissionRate = toMoney(input.commissionRate);
  if (input.isActive !== undefined) updatePayload.isActive = input.isActive;
  if (input.creditLimit !== undefined) {
    updatePayload.creditLimit = input.creditLimit === null ? null : toMoney(input.creditLimit);
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: updatePayload
  });

  await logActivity({
    userId: adminUserId,
    action: "AGENT_UPDATED",
    entityType: "AGENT",
    entityId: updated.id,
    description: `Updated agent ${updated.companyName}`
  });

  return serializeAgent(updated);
};

export const topUpAgent = async (params: {
  agentId: string;
  amount: number;
  reference: string;
  notes?: string;
  adminUserId: string;
}) => {
  if (params.amount <= 0) {
    throw new Error("Top-up amount must be greater than zero");
  }

  const agent = await prisma.agent.findUnique({
    where: { id: params.agentId },
    select: { id: true, creditBalance: true }
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const nextBalance = toMoney(asNumber(agent.creditBalance) + params.amount);

  const updatedAgent = await prisma.agent.update({
    where: { id: agent.id },
    data: { creditBalance: nextBalance }
  });

  const topUp = await prisma.topUp.create({
    data: {
      agentId: agent.id,
      amount: toMoney(params.amount),
      reference: params.reference,
      notes: params.notes,
      createdBy: params.adminUserId
    }
  });

  await logActivity({
    userId: params.adminUserId,
    action: "AGENT_TOPUP",
    entityType: "AGENT",
    entityId: params.agentId,
    description: `Top-up RM ${params.amount.toFixed(2)} for agent ${params.agentId}`
  });

  return {
    updatedAgent: serializeAgent(updatedAgent),
    topUp: { ...topUp, amount: asNumber(topUp.amount) }
  };
};

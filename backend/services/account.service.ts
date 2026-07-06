import { AccountStatus, PartyType, Prisma } from "@prisma/client";
import { prisma } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";

const deriveStatus = (status: AccountStatus, expiry: Date | null): AccountStatus => {
  if (expiry && expiry.getTime() < Date.now()) return "EXPIRED";
  return status;
};

export const listAccounts = async (params: { partyType?: PartyType; search?: string }) => {
  const where: Prisma.AgentWhereInput = { partyType: params.partyType };
  if (params.search) {
    where.OR = [
      { companyName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { accountCode: { contains: params.search, mode: "insensitive" } }
    ];
  }

  const agents = await prisma.agent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      accountCode: true,
      companyName: true,
      email: true,
      kplExpiryDate: true,
      accountStatus: true,
      accountExpiry: true,
      registration: { select: { status: true } }
    }
  });

  return agents.map((a) => ({
    id: a.id,
    accountCode: a.accountCode,
    companyName: a.companyName,
    email: a.email,
    kplExpiryDate: a.kplExpiryDate?.toISOString() ?? null,
    accountExpiry: a.accountExpiry?.toISOString() ?? null,
    registrationStatus: a.registration?.status ?? "APPROVED",
    accountStatus: deriveStatus(a.accountStatus, a.accountExpiry)
  }));
};

export const getAccountDetail = async (id: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      contactPersons: true,
      documents: { select: { id: true, docType: true, fileName: true } }
    }
  });
  if (!agent) throw new Error("Account not found");

  return {
    id: agent.id,
    accountCode: agent.accountCode,
    partyType: agent.partyType,
    companyName: agent.companyName,
    email: agent.email,
    phone: agent.phone,
    registrationNo: agent.registrationNo,
    kplLicenseNo: agent.kplLicenseNo,
    kplExpiryDate: agent.kplExpiryDate?.toISOString() ?? null,
    fax: agent.fax,
    addressLine1: agent.addressLine1,
    addressLine2: agent.addressLine2,
    addressLine3: agent.addressLine3,
    postcode: agent.postcode,
    country: agent.country,
    state: agent.state,
    targetMarket: agent.targetMarket,
    salesChannel: agent.salesChannel,
    accountStatus: deriveStatus(agent.accountStatus, agent.accountExpiry),
    accountExpiry: agent.accountExpiry?.toISOString() ?? null,
    createdDate: agent.createdAt.toISOString(),
    contactPersons: agent.contactPersons,
    documents: agent.documents
  };
};

export const updateAccount = async (
  id: string,
  data: { accountStatus?: AccountStatus; accountExpiry?: string | null },
  adminUserId: string
) => {
  const agent = await prisma.agent.update({
    where: { id },
    data: {
      accountStatus: data.accountStatus,
      accountExpiry: data.accountExpiry ? new Date(data.accountExpiry) : undefined
    }
  });

  await logActivity({
    userId: adminUserId,
    action: "ACCOUNT_UPDATED",
    entityType: "AGENT",
    entityId: id,
    description: `Updated account ${agent.accountCode ?? id}`
  });

  return { id: agent.id, accountStatus: agent.accountStatus };
};

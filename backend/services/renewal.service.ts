import { prisma } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";
import { emails } from "@backend/services/email/email.service";

export const createRenewal = async (params: {
  agentId: string;
  userId: string;
  kplLicenseNo?: string;
  kplExpiryDate?: string;
  ssmExpiryDate?: string;
  documentIds?: string[];
}) => {
  const renewal = await prisma.renewalRequest.create({
    data: {
      agentId: params.agentId,
      kplLicenseNo: params.kplLicenseNo || null,
      kplExpiryDate: params.kplExpiryDate ? new Date(params.kplExpiryDate) : null,
      ssmExpiryDate: params.ssmExpiryDate ? new Date(params.ssmExpiryDate) : null,
      status: "PENDING"
    }
  });

  if (params.documentIds?.length) {
    await prisma.document.updateMany({
      where: { id: { in: params.documentIds } },
      data: { renewalId: renewal.id, ownerId: renewal.id, ownerType: "RENEWAL" }
    });
  }

  await logActivity({
    userId: params.userId,
    action: "RENEWAL_REQUESTED",
    entityType: "RENEWAL",
    entityId: renewal.id,
    description: "Account renewal requested"
  });

  return { id: renewal.id };
};

export const getLatestRenewal = async (agentId: string) => {
  const renewal = await prisma.renewalRequest.findFirst({
    where: { agentId },
    orderBy: { createdAt: "desc" }
  });
  if (!renewal) return null;
  return {
    id: renewal.id,
    status: renewal.status,
    remarks: renewal.remarks,
    createdAt: renewal.createdAt.toISOString()
  };
};

export const listRenewals = async () => {
  const rows = await prisma.renewalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { companyName: true, email: true, accountCode: true } } }
  });
  return rows.map((r) => ({
    id: r.id,
    companyName: r.agent.companyName,
    email: r.agent.email,
    accountCode: r.agent.accountCode,
    licenseNo: r.kplLicenseNo,
    kplExpiryDate: r.kplExpiryDate?.toISOString() ?? null,
    status: r.status,
    remarks: r.remarks,
    modifiedDate: r.updatedAt.toISOString()
  }));
};

export type RenewalDecision = "APPROVED" | "REJECTED" | "REVISION";

export const verifyRenewal = async (params: {
  id: string;
  decision: RenewalDecision;
  remarks?: string;
  adminUserId: string;
}) => {
  const renewal = await prisma.renewalRequest.findUnique({
    where: { id: params.id },
    include: { agent: { select: { id: true, companyName: true, email: true, accountCode: true } } }
  });
  if (!renewal) throw new Error("Renewal not found");
  if (params.decision !== "APPROVED" && !params.remarks?.trim()) {
    throw new Error("Remarks are required for Rejected and Revision");
  }

  await prisma.renewalRequest.update({
    where: { id: renewal.id },
    data: {
      status: params.decision,
      remarks: params.remarks?.trim() || null,
      reviewedByUserId: params.adminUserId,
      reviewedAt: new Date()
    }
  });

  let newExpiry: Date | null = null;
  if (params.decision === "APPROVED") {
    newExpiry = renewal.kplExpiryDate ?? new Date();
    if (!renewal.kplExpiryDate) newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    await prisma.agent.update({
      where: { id: renewal.agent.id },
      data: {
        accountStatus: "ACTIVE",
        accountExpiry: newExpiry,
        kplExpiryDate: renewal.kplExpiryDate ?? undefined,
        kplLicenseNo: renewal.kplLicenseNo ?? undefined
      }
    });
    await emails.renewalApproved(
      renewal.agent.email,
      renewal.agent.companyName,
      renewal.agent.accountCode ?? "-",
      newExpiry.toISOString().slice(0, 10)
    );
  } else if (params.decision === "REVISION") {
    await emails.renewalRevision(renewal.agent.email, params.remarks!.trim());
  } else {
    await emails.renewalRejected(renewal.agent.email);
  }

  await logActivity({
    userId: params.adminUserId,
    action: `RENEWAL_${params.decision}`,
    entityType: "RENEWAL",
    entityId: renewal.id,
    description: `Renewal ${params.decision}`
  });

  return { status: params.decision };
};

// ---- Agent profile (company profile view) ----

export const getAgentProfile = async (agentId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      contactPersons: true,
      documents: { select: { id: true, docType: true, fileName: true } }
    }
  });
  if (!agent) throw new Error("Profile not found");

  const expiry = agent.accountExpiry;
  const twoMonthsBefore = expiry ? new Date(expiry) : null;
  if (twoMonthsBefore) twoMonthsBefore.setMonth(twoMonthsBefore.getMonth() - 2);
  const canRenew = Boolean(twoMonthsBefore && Date.now() >= twoMonthsBefore.getTime());

  return {
    companyName: agent.companyName,
    accountCode: agent.accountCode,
    partyType: agent.partyType,
    registrationNo: agent.registrationNo,
    email: agent.email,
    phone: agent.phone,
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
    createdDate: agent.createdAt.toISOString(),
    accountExpiry: expiry?.toISOString() ?? null,
    accountStatus: agent.accountStatus,
    canRenew,
    contactPersons: agent.contactPersons,
    documents: agent.documents
  };
};

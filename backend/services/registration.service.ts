import crypto from "node:crypto";
import { PartyType, Prisma } from "@prisma/client";
import { prisma } from "@backend/services/db";
import { emails } from "@backend/services/email/email.service";
import { logActivity } from "@backend/services/activity.service";
import { setTemporaryPassword } from "@backend/services/auth.service";

export interface RegistrationContactInput {
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface CreateRegistrationInput {
  partyType: PartyType;
  companyName: string;
  registrationNo: string;
  email: string;
  kplLicenseNo?: string | null;
  kplExpiryDate?: string | null;
  contactNo: string;
  fax?: string | null;
  addressLine1: string;
  addressLine2: string;
  addressLine3?: string | null;
  postcode: string;
  country: string;
  state: string;
  targetMarket?: string | null;
  salesChannel?: string | null;
  termsAccepted: boolean;
  contactPersons: RegistrationContactInput[];
  documentIds: string[];
}

const generateApplicationId = (): string =>
  crypto.randomBytes(6).toString("hex").toUpperCase();

const requireFields = (input: CreateRegistrationInput) => {
  const required: Array<[keyof CreateRegistrationInput, string]> = [
    ["companyName", "Company name"],
    ["registrationNo", "Company registration number"],
    ["email", "Email"],
    ["contactNo", "Contact number"],
    ["addressLine1", "Address line 1"],
    ["addressLine2", "Address line 2"],
    ["postcode", "Postcode"],
    ["country", "Country"],
    ["state", "State"]
  ];
  for (const [key, label] of required) {
    if (!String(input[key] ?? "").trim()) {
      throw new Error(`${label} is required`);
    }
  }
  if (!input.termsAccepted) {
    throw new Error("You must accept the Privacy Policy & Terms and Conditions");
  }
  if (!input.contactPersons?.length || !input.contactPersons[0]?.name?.trim()) {
    throw new Error("At least one contact person is required");
  }
  if (input.contactPersons.length > 3) {
    throw new Error("A maximum of three contact persons is allowed");
  }
  if (input.partyType === "AGENT" && !input.kplLicenseNo?.trim()) {
    throw new Error("KPL license number is required for agents");
  }
};

export const createRegistration = async (input: CreateRegistrationInput) => {
  requireFields(input);

  const documents = await prisma.document.findMany({
    where: { id: { in: input.documentIds ?? [] }, ownerType: "REGISTRATION" },
    select: { id: true, docType: true }
  });

  const docTypes = new Set(documents.map((d) => d.docType));
  if (!docTypes.has("SSM")) {
    throw new Error("SSM Form is required");
  }
  if (input.partyType === "AGENT" && !docTypes.has("KPL")) {
    throw new Error("KPL Form is required for agents");
  }

  const applicationId = generateApplicationId();

  const registration = await prisma.registration.create({
    data: {
      applicationId,
      partyType: input.partyType,
      companyName: input.companyName.trim(),
      registrationNo: input.registrationNo.trim(),
      email: input.email.trim().toLowerCase(),
      kplLicenseNo: input.kplLicenseNo?.trim() || null,
      kplExpiryDate: input.kplExpiryDate ? new Date(input.kplExpiryDate) : null,
      contactNo: input.contactNo.trim(),
      fax: input.fax?.trim() || null,
      addressLine1: input.addressLine1.trim(),
      addressLine2: input.addressLine2.trim(),
      addressLine3: input.addressLine3?.trim() || null,
      postcode: input.postcode.trim(),
      country: input.country.trim(),
      state: input.state.trim(),
      targetMarket: input.targetMarket?.trim() || null,
      salesChannel: input.salesChannel?.trim() || null,
      termsAcceptedAt: new Date(),
      contactPersons: {
        create: input.contactPersons
          .filter((c) => c.name?.trim())
          .slice(0, 3)
          .map((c, index) => ({
            ownerType: "REGISTRATION" as const,
            name: c.name.trim(),
            email: c.email?.trim() || null,
            phone: c.phone?.trim() || null,
            designation: c.designation?.trim() || null,
            isPrimary: index === 0
          }))
      }
    }
  });

  if (documents.length > 0) {
    await prisma.document.updateMany({
      where: { id: { in: documents.map((d) => d.id) } },
      data: { registrationId: registration.id, ownerId: registration.id }
    });
  }

  await emails.registrationSubmitted(registration.email, applicationId);

  return { applicationId: registration.applicationId, id: registration.id };
};

export const getRegistrationStatus = async (applicationId: string) => {
  const registration = await prisma.registration.findUnique({
    where: { applicationId: applicationId.trim().toUpperCase() },
    select: {
      applicationId: true,
      status: true,
      remarks: true,
      partyType: true,
      companyName: true,
      createdAt: true
    }
  });

  if (!registration) {
    throw new Error("Application not found");
  }

  return {
    applicationId: registration.applicationId,
    status: registration.status,
    remarks: registration.remarks,
    partyType: registration.partyType,
    companyName: registration.companyName,
    submissionDate: registration.createdAt
  };
};

// ---- Admin-facing (used in Phase 2) ----

export const listRegistrations = async (params: {
  partyType?: PartyType;
  status?: string;
  search?: string;
}) => {
  const where: Prisma.RegistrationWhereInput = {};
  if (params.partyType) where.partyType = params.partyType;
  if (params.status) where.status = params.status as Prisma.RegistrationWhereInput["status"];
  if (params.search) {
    where.OR = [
      { companyName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { applicationId: { contains: params.search, mode: "insensitive" } }
    ];
  }

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      applicationId: true,
      partyType: true,
      companyName: true,
      email: true,
      addressLine1: true,
      addressLine2: true,
      state: true,
      country: true,
      status: true,
      createdAt: true
    }
  });

  return registrations.map((r) => ({
    ...r,
    address: [r.addressLine1, r.addressLine2, r.state, r.country].filter(Boolean).join(", ")
  }));
};

export const getRegistrationDetail = async (id: string) => {
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      contactPersons: true,
      documents: { select: { id: true, docType: true, fileName: true } }
    }
  });
  if (!registration) throw new Error("Registration not found");
  return {
    ...registration,
    kplExpiryDate: registration.kplExpiryDate?.toISOString() ?? null
  };
};

const generateAccountCode = async (partyType: PartyType): Promise<string> => {
  const prefix = partyType === "AGENT" ? "A" : "P";
  const year = new Date().getFullYear();
  const count = await prisma.agent.count({ where: { partyType } });
  let seq = count + 1;
  // Ensure uniqueness even if counts drift.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `${prefix}${year}${String(seq).padStart(5, "0")}`;
    const existing = await prisma.agent.findUnique({ where: { accountCode: code } });
    if (!existing) return code;
    seq += 1;
  }
  throw new Error("Unable to generate account code");
};

export type VerificationDecision = "APPROVED" | "REJECTED" | "REVISION";

export const verifyRegistration = async (params: {
  registrationId: string;
  decision: VerificationDecision;
  remarks?: string;
  adminUserId: string;
}) => {
  const registration = await prisma.registration.findUnique({
    where: { id: params.registrationId },
    include: { contactPersons: true, documents: true }
  });
  if (!registration) throw new Error("Registration not found");
  if (registration.status === "APPROVED") {
    throw new Error("Registration already approved");
  }
  if (params.decision !== "APPROVED" && !params.remarks?.trim()) {
    throw new Error("Remarks are required for Rejected and Revision");
  }

  if (params.decision !== "APPROVED") {
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: params.decision,
        remarks: params.remarks?.trim() || null,
        reviewedByUserId: params.adminUserId,
        reviewedAt: new Date()
      }
    });

    if (params.decision === "REVISION") {
      await emails.registrationRevision(
        registration.email,
        registration.applicationId,
        params.remarks!.trim()
      );
    } else {
      await emails.registrationRejected(registration.email);
    }

    await logActivity({
      userId: params.adminUserId,
      action: `REGISTRATION_${params.decision}`,
      entityType: "REGISTRATION",
      entityId: registration.id,
      description: `Registration ${registration.applicationId} marked ${params.decision}`
    });

    return { status: params.decision };
  }

  // Approve → provision Agent + User
  const accountCode = await generateAccountCode(registration.partyType);
  const accountExpiry = new Date();
  accountExpiry.setFullYear(accountExpiry.getFullYear() + 1);

  const created = await prisma.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: {
        companyName: registration.companyName,
        contactName: registration.contactPersons[0]?.name ?? registration.companyName,
        phone: registration.contactNo,
        email: registration.email,
        agreementType: "PREPAID",
        commissionRate: 0,
        billingCycleStartDate: new Date(),
        partyType: registration.partyType,
        accountCode,
        registrationNo: registration.registrationNo,
        kplLicenseNo: registration.kplLicenseNo,
        kplExpiryDate: registration.kplExpiryDate,
        fax: registration.fax,
        addressLine1: registration.addressLine1,
        addressLine2: registration.addressLine2,
        addressLine3: registration.addressLine3,
        postcode: registration.postcode,
        country: registration.country,
        state: registration.state,
        targetMarket: registration.targetMarket,
        salesChannel: registration.salesChannel,
        accountStatus: "ACTIVE",
        accountExpiry,
        registrationId: registration.id
      }
    });

    // Copy contact persons + documents onto the active party
    for (const contact of registration.contactPersons) {
      await tx.contactPerson.create({
        data: {
          ownerType: "AGENT",
          agentId: agent.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation,
          isPrimary: contact.isPrimary
        }
      });
    }
    if (registration.documents.length > 0) {
      await tx.document.updateMany({
        where: { id: { in: registration.documents.map((d) => d.id) } },
        data: { agentId: agent.id }
      });
    }

    const user = await tx.user.create({
      data: {
        fullName: registration.contactPersons[0]?.name ?? registration.companyName,
        email: registration.email,
        username: accountCode,
        passwordHash: "pending",
        role: "AGENT",
        agentId: agent.id
      }
    });

    await tx.registration.update({
      where: { id: registration.id },
      data: {
        status: "APPROVED",
        remarks: params.remarks?.trim() || null,
        reviewedByUserId: params.adminUserId,
        reviewedAt: new Date(),
        createdAgentId: agent.id,
        createdUserId: user.id
      }
    });

    return { agent, user };
  });

  const { temporaryPassword } = await setTemporaryPassword(created.user.id);
  await emails.registrationApproved(registration.email, accountCode, temporaryPassword);

  await logActivity({
    userId: params.adminUserId,
    action: "REGISTRATION_APPROVED",
    entityType: "REGISTRATION",
    entityId: registration.id,
    description: `Approved ${registration.applicationId} → account ${accountCode}`
  });

  return { status: "APPROVED", accountCode };
};

export { logActivity };

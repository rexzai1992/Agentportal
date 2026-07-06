import { SchemeStatus } from "@prisma/client";
import { prisma, asNumber } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";

export interface SchemeProductInput {
  ticketTypeId: string;
  price: number;
  minQty?: number;
  maxQty?: number | null;
  incentiveRate?: number | null;
  discountRate?: number | null;
}

export interface CreateSchemeInput {
  code: string;
  name: string;
  organisation?: string | null;
  effectiveDate: string;
  products: SchemeProductInput[];
}

const mapProducts = (products: SchemeProductInput[]) =>
  products.map((p) => ({
    ticketTypeId: p.ticketTypeId,
    price: p.price,
    minQty: p.minQty ?? 1,
    maxQty: p.maxQty ?? null,
    incentiveRate: p.incentiveRate ?? null,
    discountRate: p.discountRate ?? null
  }));

export const listSchemes = async () => {
  const schemes = await prisma.scheme.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, name: true, organisation: true, status: true }
  });
  return schemes;
};

export const createScheme = async (input: CreateSchemeInput, adminUserId: string) => {
  if (!input.code?.trim() || !input.name?.trim()) {
    throw new Error("Scheme code and name are required");
  }
  if (!input.products?.length) {
    throw new Error("At least one product is required");
  }

  const scheme = await prisma.scheme.create({
    data: {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      organisation: input.organisation?.trim() || null,
      status: "ACTIVE",
      createdByUserId: adminUserId,
      revisions: {
        create: {
          revisionNumber: 1,
          effectiveDate: new Date(input.effectiveDate),
          status: "ACTIVE",
          createdByUserId: adminUserId,
          products: { create: mapProducts(input.products) }
        }
      }
    }
  });

  await logActivity({
    userId: adminUserId,
    action: "SCHEME_CREATED",
    entityType: "SCHEME",
    entityId: scheme.id,
    description: `Created scheme ${scheme.code}`
  });

  return { id: scheme.id, code: scheme.code };
};

export const getScheme = async (id: string) => {
  const scheme = await prisma.scheme.findUnique({
    where: { id },
    include: {
      revisions: {
        orderBy: { revisionNumber: "desc" },
        include: {
          products: { include: { ticketType: { select: { name: true, category: true } } } }
        }
      }
    }
  });
  if (!scheme) throw new Error("Scheme not found");

  return {
    id: scheme.id,
    code: scheme.code,
    name: scheme.name,
    organisation: scheme.organisation,
    status: scheme.status,
    revisions: scheme.revisions.map((rev) => ({
      id: rev.id,
      revisionNumber: rev.revisionNumber,
      effectiveDate: rev.effectiveDate.toISOString(),
      products: rev.products.map((p) => ({
        id: p.id,
        ticketTypeId: p.ticketTypeId,
        name: p.ticketType.name,
        category: p.ticketType.category,
        price: asNumber(p.price),
        minQty: p.minQty,
        maxQty: p.maxQty,
        incentiveRate: p.incentiveRate ? asNumber(p.incentiveRate) : null,
        discountRate: p.discountRate ? asNumber(p.discountRate) : null
      }))
    }))
  };
};

export const updateSchemeStatus = async (id: string, status: SchemeStatus) => {
  const scheme = await prisma.scheme.update({ where: { id }, data: { status } });
  return { id: scheme.id, status: scheme.status };
};

export const addSchemeRevision = async (
  id: string,
  input: { effectiveDate: string; products: SchemeProductInput[] },
  adminUserId: string
) => {
  if (!input.products?.length) throw new Error("At least one product is required");

  const last = await prisma.schemeRevision.findFirst({
    where: { schemeId: id },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true }
  });

  const revision = await prisma.schemeRevision.create({
    data: {
      schemeId: id,
      revisionNumber: (last?.revisionNumber ?? 0) + 1,
      effectiveDate: new Date(input.effectiveDate),
      status: "ACTIVE",
      createdByUserId: adminUserId,
      products: { create: mapProducts(input.products) }
    }
  });

  return { id: revision.id, revisionNumber: revision.revisionNumber };
};

// ---- Scheme binding (agent/partner) ----

export const listSchemeBindings = async (agentId: string) => {
  const bindings = await prisma.schemeAssignment.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    include: { scheme: { select: { code: true, name: true } } }
  });
  return bindings.map((b) => ({
    id: b.id,
    bindingType: b.bindingType,
    incentive: b.incentive,
    effectiveDate: b.effectiveDate.toISOString(),
    schemeCode: b.scheme.code,
    schemeName: b.scheme.name
  }));
};

export const createSchemeBinding = async (
  agentId: string,
  input: { schemeId: string; bindingType?: string; incentive?: string | null; effectiveDate: string },
  adminUserId: string
) => {
  const binding = await prisma.schemeAssignment.upsert({
    where: {
      schemeId_agentId_bindingType: {
        schemeId: input.schemeId,
        agentId,
        bindingType: input.bindingType ?? "STANDARD"
      }
    },
    update: {
      incentive: input.incentive ?? null,
      effectiveDate: new Date(input.effectiveDate)
    },
    create: {
      schemeId: input.schemeId,
      agentId,
      bindingType: input.bindingType ?? "STANDARD",
      incentive: input.incentive ?? null,
      effectiveDate: new Date(input.effectiveDate),
      assignedByUserId: adminUserId
    }
  });
  return { id: binding.id };
};

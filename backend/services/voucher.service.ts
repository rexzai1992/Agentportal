import crypto from "node:crypto";
import { Prisma, VoucherSource } from "@prisma/client";
import { prisma } from "@backend/services/db";

const genSerial = (prefix: string, index: number): string => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const batch = crypto.randomInt(100000, 999999);
  return `${prefix}-${yy}-${batch}_${String(index + 1).padStart(3, "0")}`;
};

/**
 * Issues one voucher per ticket unit for a confirmed purchase order (or complimentary grant).
 * Runs inside the caller's transaction when `tx` is provided.
 */
export const issueVouchersForOrder = async (
  orderId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) => {
  const order = await client.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order) throw new Error("Purchase order not found");

  const effectiveDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const rows: Prisma.VoucherCreateManyInput[] = [];
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      rows.push({
        serialNo: genSerial("APM-V", rows.length),
        qrToken: crypto.randomUUID(),
        source: "PURCHASE" as VoucherSource,
        purchaseOrderId: order.id,
        ticketTypeId: item.ticketTypeId,
        agentId: order.agentId,
        effectiveDate,
        expiryDate,
        redeemStatus: "NEW"
      });
    }
  }
  if (rows.length > 0) {
    await client.voucher.createMany({ data: rows });
  }
  return { issued: rows.length };
};

export const issueVouchersForComplimentary = async (
  grantId: string,
  ticketTypeId: string,
  agentId: string,
  quantity: number,
  client: Prisma.TransactionClient | typeof prisma = prisma
) => {
  const effectiveDate = new Date();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const rows: Prisma.VoucherCreateManyInput[] = [];
  for (let i = 0; i < quantity; i += 1) {
    rows.push({
      serialNo: genSerial("CMP-V", i),
      qrToken: crypto.randomUUID(),
      source: "COMPLIMENTARY" as VoucherSource,
      complimentaryGrantId: grantId,
      ticketTypeId,
      agentId,
      effectiveDate,
      expiryDate,
      redeemStatus: "NEW"
    });
  }
  if (rows.length > 0) await client.voucher.createMany({ data: rows });
  return { issued: rows.length };
};

/** Voucher-issued list grouped by order + product. */
export const listVoucherGroups = async (params: {
  agentId?: string;
  from?: string;
  to?: string;
}) => {
  const vouchers = await prisma.voucher.findMany({
    where: {
      agentId: params.agentId,
      createdAt:
        params.from || params.to
          ? {
              gte: params.from ? new Date(params.from) : undefined,
              lte: params.to ? new Date(`${params.to}T23:59:59`) : undefined
            }
          : undefined
    },
    include: {
      ticketType: { select: { name: true, category: true } },
      agent: { select: { companyName: true, accountCode: true } },
      purchaseOrder: { select: { orderReference: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const groups = new Map<
    string,
    {
      key: string;
      detailId: string | null;
      purchaseOrderId: string | null;
      reference: string;
      companyName: string;
      accountCode: string | null;
      productName: string;
      productType: string;
      issuedQty: number;
      usedQty: number;
      effectiveDate: string;
      expiryDate: string;
    }
  >();

  for (const v of vouchers) {
    const key = `${v.purchaseOrderId ?? v.complimentaryGrantId}:${v.ticketTypeId}`;
    const detailId = v.purchaseOrderId ?? v.complimentaryGrantId;
    const existing = groups.get(key);
    if (existing) {
      existing.issuedQty += 1;
      if (v.redeemStatus === "REDEEMED") existing.usedQty += 1;
    } else {
      groups.set(key, {
        key,
        detailId,
        purchaseOrderId: v.purchaseOrderId,
        reference: v.purchaseOrder?.orderReference ?? "COMPLIMENTARY",
        companyName: v.agent.companyName,
        accountCode: v.agent.accountCode,
        productName: v.ticketType.name,
        productType: v.ticketType.category,
        issuedQty: 1,
        usedQty: v.redeemStatus === "REDEEMED" ? 1 : 0,
        effectiveDate: v.effectiveDate.toISOString(),
        expiryDate: v.expiryDate.toISOString()
      });
    }
  }

  return Array.from(groups.values()).map((g) => ({
    ...g,
    availableQty: g.issuedQty - g.usedQty
  }));
};

/** Staff redemption: redeem a voucher by serial number or QR token. */
export const redeemVoucher = async (params: {
  code: string;
  staffUserId: string;
  entranceGate?: string;
}) => {
  const code = params.code.trim();
  if (!code) throw new Error("Voucher serial or QR code is required");

  const voucher = await prisma.voucher.findFirst({
    where: { OR: [{ serialNo: code }, { qrToken: code }] },
    include: {
      ticketType: { select: { name: true } },
      agent: { select: { companyName: true, accountCode: true } }
    }
  });
  if (!voucher) throw new Error("Voucher not found");
  if (voucher.redeemStatus === "REDEEMED") throw new Error("Voucher already redeemed");
  if (voucher.redeemStatus === "LOCKED") throw new Error("Voucher is locked");
  if (voucher.expiryDate.getTime() < Date.now()) throw new Error("Voucher has expired");
  if (voucher.effectiveDate.getTime() > Date.now()) throw new Error("Voucher is not yet effective");

  const updated = await prisma.voucher.update({
    where: { id: voucher.id },
    data: {
      redeemStatus: "REDEEMED",
      redeemedAt: new Date(),
      redeemedByUserId: params.staffUserId,
      entranceGate: params.entranceGate || null,
      redemptions: {
        create: {
          entranceGate: params.entranceGate || null,
          staffUserId: params.staffUserId,
          status: "REDEEMED"
        }
      }
    }
  });

  return {
    serialNo: updated.serialNo,
    productName: voucher.ticketType.name,
    companyName: voucher.agent.companyName,
    accountCode: voucher.agent.accountCode,
    redeemedAt: updated.redeemedAt?.toISOString() ?? null,
    entranceGate: updated.entranceGate
  };
};

/** Voucher-issued detail for one purchase order or complimentary grant (header + serials). */
export const getOrderVouchers = async (voucherBatchId: string, agentId?: string) => {
  const vouchers = await prisma.voucher.findMany({
    where: {
      agentId,
      OR: [{ purchaseOrderId: voucherBatchId }, { complimentaryGrantId: voucherBatchId }]
    },
    include: {
      ticketType: { select: { name: true } },
      purchaseOrder: { select: { orderReference: true } }
    },
    orderBy: { serialNo: "asc" }
  });
  if (vouchers.length === 0) return { reference: "", issuedQty: 0, usedQty: 0, availableQty: 0, vouchers: [] };

  const usedQty = vouchers.filter((v) => v.redeemStatus === "REDEEMED").length;
  return {
    reference: vouchers[0].purchaseOrder?.orderReference ?? "",
    productName: vouchers[0].ticketType.name,
    issuedQty: vouchers.length,
    usedQty,
    availableQty: vouchers.length - usedQty,
    effectiveDate: vouchers[0].effectiveDate.toISOString(),
    expiryDate: vouchers[0].expiryDate.toISOString(),
    vouchers: vouchers.map((v) => ({
      id: v.id,
      serialNo: v.serialNo,
      qrToken: v.qrToken,
      redeemStatus: v.redeemStatus,
      effectiveDate: v.effectiveDate.toISOString(),
      expiryDate: v.expiryDate.toISOString(),
      redeemedAt: v.redeemedAt?.toISOString() ?? null,
      entranceGate: v.entranceGate
    }))
  };
};

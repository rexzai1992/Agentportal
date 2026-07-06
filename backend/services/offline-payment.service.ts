import { OfflinePaymentStatus } from "@prisma/client";
import { prisma, asNumber } from "@backend/services/db";
import { logActivity } from "@backend/services/activity.service";
import { emails } from "@backend/services/email/email.service";
import { issueVouchersForOrder } from "@backend/services/voucher.service";

export const listPaymentGroups = () =>
  prisma.paymentGroup.findMany({ where: { active: true }, orderBy: { name: "asc" } });

export const listPaymentTypes = () =>
  prisma.paymentType.findMany({ where: { active: true }, orderBy: { name: "asc" } });

export const submitOfflinePayment = async (params: {
  agentId: string;
  userId: string;
  orderReference: string;
  paymentGroupId?: string;
  paymentTypeId?: string;
  slipDocumentId: string;
  bankReference?: string;
}) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { orderReference: params.orderReference }
  });
  if (!order || order.agentId !== params.agentId) throw new Error("Purchase order not found");
  if (!params.slipDocumentId) throw new Error("Proof of payment is required");

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.offlinePayment.create({
      data: {
        agentId: params.agentId,
        paymentGroupId: params.paymentGroupId || null,
        paymentTypeId: params.paymentTypeId || null,
        amount: order.totalPayable,
        bankReference: params.bankReference || null,
        slipDocumentId: params.slipDocumentId,
        status: "PENDING_APPROVAL",
        submittedByUserId: params.userId,
        orderLinks: { create: { purchaseOrderId: order.id } },
        history: { create: { toStatus: "PENDING_APPROVAL", actorUserId: params.userId } }
      }
    });
    await tx.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "PENDING_APPROVAL" }
    });
    return created;
  });

  await logActivity({
    userId: params.userId,
    action: "OFFLINE_PAYMENT_SUBMITTED",
    entityType: "OFFLINE_PAYMENT",
    entityId: payment.id,
    description: `Offline payment submitted for ${order.orderReference}`
  });

  return { id: payment.id };
};

export const listOfflinePayments = async (params: { status?: OfflinePaymentStatus; pending?: boolean }) => {
  const payments = await prisma.offlinePayment.findMany({
    where: params.status ? { status: params.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      orderLinks: { include: { purchaseOrder: { select: { orderReference: true } } } }
    }
  });
  return payments.map((p) => ({
    id: p.id,
    reference: p.orderLinks[0]?.purchaseOrder.orderReference ?? "-",
    companyName: p.agent.companyName,
    accountCode: p.agent.accountCode,
    amount: asNumber(p.amount),
    status: p.status,
    financePaidAt: p.financePaidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString()
  }));
};

export const getOfflinePaymentDetail = async (id: string) => {
  const p = await prisma.offlinePayment.findUnique({
    where: { id },
    include: {
      agent: { select: { companyName: true, accountCode: true } },
      paymentGroup: { select: { name: true } },
      paymentType: { select: { name: true } },
      orderLinks: {
        include: {
          purchaseOrder: {
            include: { items: { include: { ticketType: { select: { name: true, category: true } } } } }
          }
        }
      }
    }
  });
  if (!p) throw new Error("Payment not found");
  const order = p.orderLinks[0]?.purchaseOrder;
  return {
    id: p.id,
    companyName: p.agent.companyName,
    accountCode: p.agent.accountCode,
    reference: order?.orderReference ?? "-",
    amount: asNumber(p.amount),
    status: p.status,
    paymentGroup: p.paymentGroup?.name ?? null,
    paymentType: p.paymentType?.name ?? null,
    slipDocumentId: p.slipDocumentId,
    bankReference: p.bankReference,
    financePaidAt: p.financePaidAt?.toISOString() ?? null,
    transactionDate: order?.createdAt.toISOString() ?? p.createdAt.toISOString(),
    items:
      order?.items.map((i) => ({
        productType: i.ticketType.category,
        productName: i.ticketType.name,
        quantity: i.quantity,
        unitPrice: asNumber(i.unitPrice),
        lineTotal: asNumber(i.lineTotal)
      })) ?? []
  };
};

export const markPaymentPaid = async (id: string, financeUserId: string) => {
  const payment = await prisma.offlinePayment.update({
    where: { id },
    data: {
      financePaidByUserId: financeUserId,
      financePaidAt: new Date(),
      history: { create: { toStatus: "PENDING_APPROVAL", actorUserId: financeUserId, remarks: "Marked paid by finance" } }
    }
  });
  await logActivity({
    userId: financeUserId,
    action: "OFFLINE_PAYMENT_MARKED_PAID",
    entityType: "OFFLINE_PAYMENT",
    entityId: id,
    description: "Finance marked payment as paid"
  });
  return { id: payment.id, financePaidAt: payment.financePaidAt };
};

export type PaymentDecision = "APPROVED" | "REJECTED" | "REVISION";

const decisionToOrderStatus = {
  APPROVED: "ORDER_CONFIRMED",
  REJECTED: "REJECTED",
  REVISION: "REVISION"
} as const;

const decisionToPaymentStatus: Record<PaymentDecision, OfflinePaymentStatus> = {
  APPROVED: "ORDER_CONFIRMED",
  REJECTED: "REJECTED",
  REVISION: "REVISION"
};

export const approveOfflinePayment = async (params: {
  id: string;
  decision: PaymentDecision;
  reason?: string;
  adminUserId: string;
}) => {
  const payment = await prisma.offlinePayment.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { email: true } },
      orderLinks: { include: { purchaseOrder: { select: { id: true, orderReference: true } } } }
    }
  });
  if (!payment) throw new Error("Payment not found");
  if (params.decision !== "APPROVED" && !params.reason?.trim()) {
    throw new Error("Reason is required for Rejected and Revision");
  }
  if (params.decision === "APPROVED" && !payment.financePaidAt) {
    throw new Error("Finance must mark the payment as paid before approval");
  }

  const order = payment.orderLinks[0]?.purchaseOrder;

  await prisma.$transaction(async (tx) => {
    await tx.offlinePayment.update({
      where: { id: payment.id },
      data: {
        status: decisionToPaymentStatus[params.decision],
        adminApprovedByUserId: params.adminUserId,
        adminApprovedAt: new Date(),
        remarks: params.reason?.trim() || null,
        history: {
          create: {
            fromStatus: payment.status,
            toStatus: decisionToPaymentStatus[params.decision],
            actorUserId: params.adminUserId,
            remarks: params.reason?.trim() || null
          }
        }
      }
    });

    if (order) {
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: decisionToOrderStatus[params.decision] }
      });
      if (params.decision === "APPROVED") {
        await issueVouchersForOrder(order.id, tx);
      }
    }
  });

  if (order) {
    if (params.decision === "APPROVED") {
      await emails.offlinePaymentConfirmed(payment.agent.email, order.orderReference);
    } else if (params.decision === "REVISION") {
      await emails.offlinePaymentRevision(payment.agent.email, order.orderReference, params.reason!.trim());
    } else {
      await emails.offlinePaymentRejected(payment.agent.email, order.orderReference, params.reason!.trim());
    }
  }

  await logActivity({
    userId: params.adminUserId,
    action: `OFFLINE_PAYMENT_${params.decision}`,
    entityType: "OFFLINE_PAYMENT",
    entityId: params.id,
    description: `Offline payment ${params.decision}`
  });

  return { status: params.decision };
};

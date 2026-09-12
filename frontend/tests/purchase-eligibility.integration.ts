import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { prisma } from '../../backend/services/db';
import { createPurchaseOrder, getAgentCatalog } from '../../backend/services/purchase-order.service';

async function main() {
  const tag = `ELIGIBILITY-${crypto.randomUUID()}`;
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  const agent = await prisma.agent.create({ data: { companyName: tag, contactName: tag, phone: 'test', email: `${tag}@example.invalid`, agreementType: 'PREPAID', commissionRate: 0, billingCycleStartDate: new Date() } });
  const outlet = await prisma.outlet.create({ data: { name: tag, code: tag } });
  const ticket = await prisma.ticketType.create({ data: { outletId: outlet.id, name: tag, category: 'ADULT', sellingPrice: 20, costPrice: 10, commissionRate: 0, validityType: 'FIXED_DATE' } });
  const scheme = await prisma.scheme.create({ data: { code: tag, name: tag, createdByUserId: admin.id } });
  const past = new Date(Date.now() - 86400000);
  const future = new Date(Date.now() + 86400000);
  const rev = async (n: number, date: Date, price: number) => prisma.schemeRevision.create({ data: { schemeId: scheme.id, revisionNumber: n, effectiveDate: date, createdByUserId: admin.id, products: { create: { ticketTypeId: ticket.id, price, minQty: 2, maxQty: 5 } } }, include: { products: true } });
  const checkout = (id: string, quantity = 2) => createPurchaseOrder({ agentId: agent.id, userId: admin.id, items: [{ schemeProductId: id, quantity }] });
  const hidden = async (id: string) => {
    assert.equal((await getAgentCatalog(agent.id)).some(p => p.schemeProductId === id), false);
    await assert.rejects(checkout(id), /no longer available/);
  };
  try {
    const old = await rev(1, past, 20);
    await hidden(old.products[0].id); // unassigned
    const assignment = await prisma.schemeAssignment.create({ data: { schemeId: scheme.id, agentId: agent.id, assignedByUserId: admin.id, effectiveDate: future } });
    await hidden(old.products[0].id); // future assignment
    await prisma.schemeAssignment.update({ where: { id: assignment.id }, data: { effectiveDate: past } });
    assert.equal((await getAgentCatalog(agent.id)).length, 1);
    const current = await rev(2, past, 25);
    await hidden(old.products[0].id); // stale cart
    const scheduled = await rev(3, future, 30);
    await hidden(scheduled.products[0].id);
    assert.equal((await getAgentCatalog(agent.id))[0].schemeProductId, current.products[0].id);
    const order = await checkout(current.products[0].id);
    const saved = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(Number(saved.totalPayable), 50);
    await assert.rejects(checkout(current.products[0].id, 1), /Quantity/);
    await assert.rejects(checkout(current.products[0].id, 6), /Quantity/);
    await assert.rejects(checkout(current.products[0].id, 2.5), /whole-number/);
    await assert.rejects(createPurchaseOrder({ agentId: agent.id, userId: admin.id, items: [{ schemeProductId: current.products[0].id, quantity: 3 }, { schemeProductId: current.products[0].id, quantity: 3 }] }), /duplicate/);
    await prisma.ticketType.update({ where: { id: ticket.id }, data: { active: false } });
    await hidden(current.products[0].id);
    await prisma.ticketType.update({ where: { id: ticket.id }, data: { active: true } });
    await prisma.outlet.update({ where: { id: outlet.id }, data: { active: false } });
    await hidden(current.products[0].id);
    await prisma.outlet.update({ where: { id: outlet.id }, data: { active: true } });
    await prisma.scheme.update({ where: { id: scheme.id }, data: { status: 'INACTIVE' } });
    await hidden(current.products[0].id);
    await prisma.scheme.update({ where: { id: scheme.id }, data: { status: 'ACTIVE' } });
    await prisma.agent.update({ where: { id: agent.id }, data: { accountStatus: 'INACTIVE' } });
    await assert.rejects(checkout(current.products[0].id), /inactive or expired/);
    await prisma.agent.update({ where: { id: agent.id }, data: { accountStatus: 'ACTIVE', accountExpiry: past } });
    await assert.rejects(checkout(current.products[0].id), /inactive or expired/);
    assert.equal(await prisma.purchaseOrder.count({ where: { agentId: agent.id } }), 1, 'Rejected requests must not create orders');
    console.log('PASS: valid pricing; unassigned/future/stale/inactive eligibility; account expiry; quantity and duplicate guards; rejected requests create no orders');
  } finally {
    const orders = await prisma.purchaseOrder.findMany({ where: { agentId: agent.id }, select: { id: true } });
    await prisma.activityLog.deleteMany({ where: { entityType: 'PURCHASE_ORDER', entityId: { in: orders.map(o => o.id) } } });
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: orders.map(o => o.id) } } });
    await prisma.purchaseOrder.deleteMany({ where: { agentId: agent.id } });
    await prisma.scheme.delete({ where: { id: scheme.id } });
    await prisma.ticketType.delete({ where: { id: ticket.id } });
    await prisma.outlet.delete({ where: { id: outlet.id } });
    await prisma.agent.delete({ where: { id: agent.id } });
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });

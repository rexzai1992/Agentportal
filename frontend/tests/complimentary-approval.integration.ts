import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { prisma } from '../../backend/services/db';
import { createComplimentary, reviewComplimentary } from '../../backend/services/complimentary.service';

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  const finance = await prisma.user.findFirstOrThrow({ where: { role: 'FINANCE' } });
  const tag = `CMP-TEST-${crypto.randomUUID()}`;
  const fixtures = await prisma.$transaction(async tx => {
    const agent = await tx.agent.create({ data: { companyName: tag, contactName: tag, phone: 'test', email: `${tag}@example.invalid`, agreementType: 'PREPAID', commissionRate: 0, billingCycleStartDate: new Date() } });
    const outlet = await tx.outlet.create({ data: { name: tag, code: tag } });
    const product = await tx.ticketType.create({ data: { outletId: outlet.id, name: tag, category: 'ADULT', sellingPrice: 20, costPrice: 10, commissionRate: 0, validityType: 'FIXED_DATE' } });
    return { agent, outlet, product };
  });
  const { agent, outlet, product } = fixtures;
  const request = () => createComplimentary({ agentId: agent.id, adminUserId: admin.id, reason: 'Test approval', items: [{ ticketTypeId: product.id, quantity: 20 }] });
  try {
    const pending = await request();
    assert.equal(pending.status, 'PENDING');
    assert.equal(await prisma.voucher.count({ where: { complimentaryGrantId: pending.id } }), 0);
    await assert.rejects(reviewComplimentary({ id: pending.id, userId: admin.id, decision: 'APPROVED' }), /Forbidden/);
    const results = await Promise.allSettled([1, 2].map(() => reviewComplimentary({ id: pending.id, userId: finance.id, decision: 'APPROVED' })));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await prisma.voucher.count({ where: { complimentaryGrantId: pending.id } }), 20);
    const approved = await prisma.complimentaryGrant.findUniqueOrThrow({ where: { id: pending.id } });
    assert.equal(approved.reviewedByUserId, finance.id);
    await assert.rejects(reviewComplimentary({ id: pending.id, userId: finance.id, decision: 'REJECTED', remarks: 'Too late' }), /already been reviewed/);
    const rejected = await request();
    await assert.rejects(reviewComplimentary({ id: rejected.id, userId: finance.id, decision: 'REJECTED' }), /reason/);
    await reviewComplimentary({ id: rejected.id, userId: finance.id, decision: 'REJECTED', remarks: 'Not approved' });
    assert.equal(await prisma.voucher.count({ where: { complimentaryGrantId: rejected.id } }), 0);
    const own = await request();
    await prisma.complimentaryGrant.update({ where: { id: own.id }, data: { createdByUserId: finance.id } });
    await assert.rejects(reviewComplimentary({ id: own.id, userId: finance.id, decision: 'APPROVED' }), /own request/);
    const invalidated = await request();
    await prisma.ticketType.update({ where: { id: product.id }, data: { active: false } });
    await assert.rejects(reviewComplimentary({ id: invalidated.id, userId: finance.id, decision: 'APPROVED' }), /active/);
    assert.equal((await prisma.complimentaryGrant.findUniqueOrThrow({ where: { id: invalidated.id } })).status, 'PENDING');
    assert.equal(await prisma.voucher.count({ where: { complimentaryGrantId: invalidated.id } }), 0);
    console.log('PASS: pending issues zero vouchers; Finance approval issues once; concurrent/repeated/self/unauthorized review rejected; rejection issues zero; failed issuance rolls approval back');
  } finally {
    const grants = await prisma.complimentaryGrant.findMany({ where: { agentId: agent.id } });
    await prisma.activityLog.deleteMany({ where: { entityType: 'COMPLIMENTARY', entityId: { in: grants.map(g => g.id) } } });
    await prisma.voucher.deleteMany({ where: { agentId: agent.id } });
    await prisma.complimentaryGrant.deleteMany({ where: { agentId: agent.id } });
    await prisma.ticketType.delete({ where: { id: product.id } });
    await prisma.outlet.delete({ where: { id: outlet.id } });
    await prisma.agent.delete({ where: { id: agent.id } });
    await prisma.$disconnect();
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });

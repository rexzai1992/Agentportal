import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import { prisma } from '../../backend/services/db';
import { createProductBatch } from '../../backend/services/product-batch.service';
import { readProductWorkbook } from '../../backend/services/product-import.service';
import { parseProductBatch } from '../../shared/types/product-batch';

async function main() {
  const prefix = `BULK-TEST-${crypto.randomUUID()}`.toUpperCase();
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  const outlet = await prisma.outlet.create({ data: { name: prefix, code: prefix, active: true } });
  let schemeId: string | undefined;
  const product = (suffix: string) => ({ name: `Test ${suffix}`, sku: `${prefix}-${suffix}`, type: 'ADULT', price: 12.50 });
  try {
    assert.throws(() => parseProductBatch({ outletId: outlet.id, products: [product('X'), product('X')] }), /Row 2.*Duplicate SKU/);
    assert.throws(() => parseProductBatch({ outletId: outlet.id, products: [{ ...product('X'), price: -1 }] }), /Row 1/);
    assert.throws(() => parseProductBatch({ outletId: outlet.id, products: [{ ...product('X'), price: 1.234 }] }), /decimal places/);
    const standalone = await createProductBatch({ outletId: outlet.id, products: [product('A'), product('B')] }, admin.id);
    assert.equal(standalone.count, 2);
    await assert.rejects(createProductBatch({ outletId: outlet.id, products: [product('C'), product('A')] }, admin.id), /SKU already exists/);
    assert.equal(await prisma.ticketType.count({ where: { sku: `${prefix}-C` } }), 0, 'Duplicate batch must not partially create rows');
    const scheme = await prisma.scheme.create({ data: { code: prefix, name: prefix, createdByUserId: admin.id, revisions: { create: {
      revisionNumber: 1, effectiveDate: new Date('2020-01-01'), createdByUserId: admin.id,
      products: { create: { ticketTypeId: standalone.ids[0], price: 9, minQty: 2, maxQty: 10, incentiveRate: 3, discountRate: 2 } }
    } } } });
    schemeId = scheme.id;
    const linked = await createProductBatch({ outletId: outlet.id, schemeId, products: [{ ...product('C'), schemePrice: 8 }, product('D')] }, admin.id);
    const revision = await prisma.schemeRevision.findFirstOrThrow({ where: { schemeId }, orderBy: { revisionNumber: 'desc' }, include: { products: true } });
    assert.equal(revision.products.length, 3);
    const preserved = revision.products.find(p => p.ticketTypeId === standalone.ids[0])!;
    assert.equal(Number(preserved.price), 9); assert.equal(preserved.minQty, 2); assert.equal(Number(preserved.discountRate), 2);
    assert.equal(Number(revision.products.find(p => p.ticketTypeId === linked.ids[0])!.price), 8);
    assert.equal(Number(revision.products.find(p => p.ticketTypeId === linked.ids[1])!.price), 12.5);
    const concurrent = await Promise.allSettled([1, 2].map(() => createProductBatch({ outletId: outlet.id, products: [product('RACE')] }, admin.id)));
    assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await prisma.ticketType.count({ where: { sku: `${prefix}-RACE` } }), 1);
    await prisma.outlet.update({ where: { id: outlet.id }, data: { active: false } });
    await assert.rejects(createProductBatch({ outletId: outlet.id, products: [product('E')] }, admin.id), /active outlet/);
    const wb = new ExcelJS.Workbook(); const sheet = wb.addWorksheet('Products');
    sheet.addRow(['Name', 'SKU', 'Type', 'Price', 'Scheme Price']);
    sheet.addRow(['Adult', 'EXCEL-A', 'adult', 12.5, 10]); sheet.addRow(['Child', 'EXCEL-B', 'CHILD', 8]);
    const bytes = await wb.xlsx.writeBuffer();
    const imported = await readProductWorkbook(bytes as unknown as ArrayBuffer);
    assert.equal(imported.length, 2); assert.equal(imported[0].schemePrice, 10); assert.equal(imported[1].type, 'CHILD');
    sheet.getCell('D2').value = { formula: '1+1', result: 2 };
    await assert.rejects(readProductWorkbook(await wb.xlsx.writeBuffer() as unknown as ArrayBuffer), /plain values/);
    console.log('PASS: bulk creation, duplicate/invalid rows, atomic failure, preserved scheme pricing, defaults/overrides, concurrent submit, inactive outlet and Excel import');
  } finally {
    if (schemeId) await prisma.scheme.delete({ where: { id: schemeId } });
    await prisma.activityLog.deleteMany({ where: { action: 'PRODUCT_BATCH_CREATED', description: { contains: prefix } } });
    await prisma.ticketType.deleteMany({ where: { outletId: outlet.id } });
    await prisma.outlet.delete({ where: { id: outlet.id } });
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });

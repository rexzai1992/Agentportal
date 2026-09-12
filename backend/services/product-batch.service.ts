import { Prisma } from "@prisma/client";
import { prisma } from "@backend/services/db";
import { parseProductBatch } from "@shared/types/product-batch";

export async function createProductBatch(input: unknown, userId: string) {
  const batch = parseProductBatch(input);
  try {
    return await prisma.$transaction(async (tx) => {
      const outlet = await tx.outlet.findFirst({ where: { id: batch.outletId, active: true } });
      if (!outlet) throw new Error("Choose an active outlet before creating products");
      const duplicates = await tx.ticketType.findMany({
        where: { sku: { in: batch.products.map((p) => p.sku) } }, select: { sku: true }
      });
      if (duplicates.length) throw new Error(`SKU already exists: ${duplicates.map((p) => p.sku).join(", ")}. No products were created.`);
      const scheme = batch.schemeId ? await tx.scheme.findFirst({
        where: { id: batch.schemeId, status: "ACTIVE" },
        include: { revisions: { orderBy: { revisionNumber: "desc" }, take: 1, include: { products: true } } }
      }) : null;
      if (batch.schemeId && !scheme) throw new Error("Selected scheme is no longer active. Choose another scheme or create without one.");

      const created = [];
      for (const row of batch.products) {
        created.push(await tx.ticketType.create({ data: {
          outletId: outlet.id, name: row.name, sku: row.sku, category: row.type,
          description: batch.description || null, imageUrl: batch.imageUrl || null,
          sellingPrice: row.price, costPrice: row.price, commissionRate: 10,
          validityType: "FIXED_DATE", active: true
        } }));
      }
      let schemeEffectiveDate: string | null = null;
      if (scheme) {
        const previous = scheme.revisions[0];
        const effectiveDate = new Date(Math.max(Date.now(), previous?.effectiveDate.getTime() ?? 0));
        schemeEffectiveDate = effectiveDate.toISOString();
        await tx.schemeRevision.create({ data: {
          schemeId: scheme.id, revisionNumber: (previous?.revisionNumber ?? 0) + 1,
          effectiveDate, status: "ACTIVE", createdByUserId: userId,
          products: { create: [
            ...(previous?.products ?? []).map((p) => ({
              ticketTypeId: p.ticketTypeId, price: p.price, minQty: p.minQty,
              maxQty: p.maxQty, incentiveRate: p.incentiveRate, discountRate: p.discountRate
            })),
            ...created.map((p, index) => ({ ticketTypeId: p.id,
              price: batch.products[index].schemePrice ?? batch.products[index].price, minQty: 1 }))
          ] }
        } });
      }
      await tx.activityLog.create({ data: {
        userId, action: "PRODUCT_BATCH_CREATED", entityType: "PRODUCT_BATCH", entityId: created[0].id,
        description: `Created ${created.length} products at ${outlet.name}${scheme ? `; added to ${scheme.code}` : ""}: ${created.map((p) => p.sku).join(", ")}`
      } });
      return { count: created.length, ids: created.map((p) => p.id), schemeName: scheme?.name ?? null, schemeEffectiveDate };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new Error("A SKU or scheme revision was created concurrently. Refresh and check the catalog before retrying. This batch was not saved.");
      if (error.code === "P2034") throw new Error("Another user changed these products or this scheme. Refresh and retry. This batch was not saved.");
    }
    throw error;
  }
}

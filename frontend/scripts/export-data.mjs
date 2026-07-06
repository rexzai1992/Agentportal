/**
 * Exports every database table to JSON files for transfer/integration
 * into another project (e.g. QSTUDIO).
 *
 * Usage:  node scripts/export-data.mjs [outputDir]
 * Output: one <table>.json per model + _manifest.json (row counts)
 *
 * Decimal columns are serialized as strings (exact), dates as ISO strings.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OUT = path.resolve(process.argv[2] || "../exports");

// Model name → prisma client accessor. Ordered parent-first so an importer
// can replay files in this order without FK violations.
const MODELS = [
  "user",
  "agent",
  "registration",
  "contactPerson",
  "document",
  "renewalRequest",
  "announcement",
  "outlet",
  "ticketType",
  "scheme",
  "schemeRevision",
  "schemeProduct",
  "schemeAssignment",
  "purchaseOrder",
  "purchaseOrderItem",
  "paymentGroup",
  "paymentType",
  "offlinePayment",
  "offlinePaymentOrder",
  "paymentStatusHistory",
  "complimentaryGrant",
  "voucher",
  "voucherRedemption",
  "booking",
  "ticket",
  "invoice",
  "topUp",
  "activityLog"
];

const serialize = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof value.toFixed === "function") return String(value);
  if (typeof value === "object" && value.constructor?.name === "Decimal") return String(value);
  return value;
};

const serializeRow = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k, serialize(v)]));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = { exportedAt: new Date().toISOString(), tables: {} };

  for (const model of MODELS) {
    const client = prisma[model];
    if (!client) {
      console.warn(`skip (no model): ${model}`);
      continue;
    }
    const rows = await client.findMany();
    const file = path.join(OUT, `${model}.json`);
    fs.writeFileSync(file, JSON.stringify(rows.map(serializeRow), null, 2));
    manifest.tables[model] = rows.length;
    console.log(`✓ ${model}: ${rows.length} rows`);
  }

  fs.writeFileSync(path.join(OUT, "_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nExport complete → ${OUT}`);
  console.log("Note: uploaded files live in the repo-root uploads/ folder — copy it alongside this export.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

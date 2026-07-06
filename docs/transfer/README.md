# Transfer & Integration Guide

How to move this Agent Portal — database, data, files, and business logic — into
another project (a standalone deployment, another Postgres app, or **QSTUDIO** as a plugin).

## What's in this folder

| Artifact | What it is |
|---|---|
| `schema.sql` | Complete standalone DDL of the whole database (generated from the Prisma schema). Run on any empty Postgres to recreate every table/enum/index/FK. Regenerate anytime: `cd frontend && npx prisma migrate diff --from-empty --to-schema-datamodel ../backend/prisma/schema.prisma --script > ../docs/transfer/schema.sql` |
| `qstudio/plugin_agentportal_init.sql` | QSTUDIO-contract install migration (namespaced `plugin_agentportal_*`, `company_id` tenancy, composite uniques, idempotent). **Validated: installs 20 tables, re-runs cleanly, uninstall drops everything.** |
| `qstudio/agentportal_uninstall.sql` | Full teardown twin |
| `qstudio/README.md` | Model-by-model mapping to QSTUDIO concepts (shop_products, shop_orders, members, storage, notification_outbox) + what NOT to port (auth) |

## Data export

```bash
cd frontend
node scripts/export-data.mjs            # → ../exports/<table>.json + _manifest.json
```

- One JSON file per table, written **parent-first** so an importer can replay them
  in file order without FK violations.
- Decimals are exported as exact strings, dates as ISO-8601.
- Primary keys are cuid TEXT — they survive any migration without id remapping.
- Uploaded documents live in the repo-root `uploads/` folder (paths stored in
  `Document.storagePath`) — copy that folder alongside the export.

## Architecture: what's portable and where the seams are

```
frontend/app/api/**/route.ts      HTTP layer (Next.js-specific, thin)
        ↓
backend/controllers/*.ts          thin re-export objects
        ↓
backend/services/*.service.ts     ★ ALL business logic — plain TypeScript + Prisma
        ↓
backend/prisma/schema.prisma      ★ the data model (this folder's schema.sql)
shared/types + shared/utils       framework-free types/helpers
```

The **service layer is the port surface**. It has no Next.js imports — moving to
another framework (Express, QSTUDIO's data/ layer, etc.) means re-hosting the
service functions and swapping the data client. Three infra services were built
as **single-swap-point abstractions** for exactly this reason:

| Concern | Swap point | Default impl |
|---|---|---|
| Email | `backend/services/email/email.service.ts` (driver selected by `EMAIL_DRIVER`) | console logger — add an SMTP/Resend/outbox driver without touching call sites |
| File storage | `backend/services/upload.service.ts` (save/read in one file) | local disk `uploads/` — swap body for S3/Supabase Storage |
| Excel export | `backend/services/export/excel.service.ts` | exceljs Buffer — reusable anywhere |

Auth (`auth.service.ts`, `token.service.ts`, jose + bcrypt) is standard JWT and
portable to any Node host — **except into QSTUDIO, which forbids new auth**
(see `qstudio/README.md` for the replacement strategy).

## Environment variables (complete list)

```
DATABASE_URL              Postgres connection
JWT_ACCESS_SECRET         access-token secret (also signs voucher QR HMAC)
JWT_REFRESH_SECRET        refresh-token secret
JWT_ACCESS_EXPIRES_IN     default 15m
JWT_REFRESH_EXPIRES_IN    default 7d
APP_URL                   base URL
UPLOAD_DIR                default "uploads" (repo root)
EMAIL_DRIVER              default "console"
```

## Rebuild from scratch on a new machine

```bash
cd frontend
npm install
cp .env.example .env.local              # fill in DATABASE_URL + secrets
npm run prisma:migrate                  # or: psql < docs/transfer/schema.sql
npm run prisma:seed                     # demo users, scheme, payment lookups
npm run build && npm run start
```

## Module inventory (for scoping a partial port)

| Module | Tables | Services |
|---|---|---|
| Registration & approval | Registration, ContactPerson, Document | registration.service |
| Accounts & renewal | Agent (portal fields), RenewalRequest | account.service, renewal.service |
| Schemes | Scheme, SchemeRevision, SchemeProduct, SchemeAssignment | scheme.service |
| Purchase & cart | PurchaseOrder, PurchaseOrderItem | purchase-order.service |
| Offline payment | OfflinePayment, OfflinePaymentOrder, PaymentStatusHistory, PaymentGroup, PaymentType | offline-payment.service |
| Vouchers & redemption | Voucher, VoucherRedemption, ComplimentaryGrant | voucher.service, complimentary.service |
| Announcements | Announcement | announcement.service |
| Reports | (reads the above) | portal-report.service |
| Legacy retail (not portal) | Booking, Ticket, Invoice, TopUp, Klook* | leave behind unless needed |

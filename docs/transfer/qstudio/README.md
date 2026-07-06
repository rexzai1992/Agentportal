# plugin_agentportal — QSTUDIO integration package

This folder is the **database half** of porting the Offline-Ota Agent Portal into
QSTUDIO as a plugin, following the contract in `plugins/PLUGINS.md` / `ONBOARDING.md`.

## Files

| File | Purpose |
|---|---|
| `plugin_agentportal_init.sql` | Install migration — 19 namespaced, tenant-safe tables (idempotent) |
| `agentportal_uninstall.sql` | Full teardown twin |
| `../schema.sql` | The original (non-QSTUDIO) standalone schema, for any other target |

## Contract compliance checklist

- ✅ Every table prefixed `plugin_agentportal_`
- ✅ Every table has `company_id uuid NOT NULL` + an index on it
- ✅ Every UNIQUE is composite with `company_id` (no global uniques)
- ✅ Enums are TEXT + CHECK constraints (no custom types → clean uninstall)
- ✅ No FKs to `auth.users` — all actor references are soft text columns (`reviewed_by`, `finance_paid_by`, …)
- ✅ No RLS policies, no SECURITY DEFINER, no triggers
- ✅ Idempotent install (`IF NOT EXISTS`), complete uninstall

## What maps to what (Offline-Ota → QSTUDIO)

| Offline-Ota model | QSTUDIO home | Notes |
|---|---|---|
| `Agent` (portal fields) | `plugin_agentportal_accounts` | `member_id uuid` soft-links to `merchant_customers` — set at approval time |
| `User` (auth, roles, passwords) | **DO NOT PORT** | QSTUDIO forbids new auth. Agent login = member session (`CustomerAuthContext`); Admin/Finance = merchant staff with plugin permissions declared in `definition.ts` |
| `Registration`, `ContactPerson`, `Document`, `RenewalRequest` | matching plugin tables | Documents go in a `plugin_agentportal_docs` storage bucket; `storage_path` holds the object key |
| `TicketType` / `Outlet` | **`shop_products`** (existing catalog) | Do not duplicate the catalog. `scheme_products.product_id`, `purchase_order_items.product_id`, `vouchers.product_id` are soft refs to `shop_products.id` |
| `Scheme*`, `SchemeAssignment` | matching plugin tables | Agent-specific wholesale pricing layered *on top of* shop_products |
| `PurchaseOrder` | plugin table + optional `shop_order_id` | If the deployment wants orders in the `shop_orders` pipeline, create the shop order at submit time and keep portal state here |
| `OfflinePayment` + history + lookups | matching plugin tables | Offline/manual bank transfer only. **Online payments must go through `paymentGatewayService`** — never a parallel path |
| `Voucher`, `VoucherRedemption` | plugin tables + optional `entitlement_id` | If the platform's pass/claim entitlements should drive gate access, link vouchers to entitlements instead of building a second scanner path |
| Commission / incentive | extend the existing commissions engine (`kind` discriminator) | Do not port our `commissionRate` ledger logic |
| `Booking`, `Ticket`, `Invoice`, `TopUp`, Klook models | **not part of the portal** | Legacy retail flow — leave behind |

## What the code port looks like

The business logic lives in `backend/services/*.service.ts` and is UI-framework-free
(plain TypeScript + Prisma). To port a module into `plugins/agentportal/`:

1. Copy the service logic into `plugins/agentportal/data/` and swap Prisma calls
   for supabase queries on the `plugin_agentportal_*` tables — **adding
   `.eq('company_id', companyId)` to every query** (rule #1).
2. Pages/components re-use the flow of `frontend/app/**` pages (they only talk to
   the service layer through fetch — no Prisma in components).
3. Email triggers: replace `backend/services/email/*` with the platform's
   `notification_outbox`.
4. File upload: replace `backend/services/upload.service.ts` with supabase Storage
   on the plugin bucket.
5. Scheduled work (renewal reminders, temp-password expiry, announcement expiry):
   declare SQL functions in `definition.ts` `scheduledJobs[]` — do not assume pg_cron.
6. Phone numbers: normalize to `60xxxxxxxxx` before insert AND lookup.
7. Timezone: business day = `Asia/Kuala_Lumpur` (`(ts AT TIME ZONE 'Asia/Kuala_Lumpur')::date`).

## Data migration

1. Run `node scripts/export-data.mjs` in `frontend/` — writes one JSON file per
   table (Decimals as strings, dates as ISO). Row ids are cuid TEXT and the
   plugin tables keep TEXT primary keys, so **data imports 1:1 with no id remapping**.
2. For each row, set `company_id` to the target tenant's uuid.
3. Map `TicketType.id` values to the corresponding `shop_products.id` (a simple
   lookup table built when the products are recreated in the catalog).
4. Copy the repo-root `uploads/` folder into the plugin storage bucket and update
   `documents.storage_path` keys.

## Deliverable structure reminder (per ONBOARDING §8)

```
plugins/agentportal/
  definition.ts      ← routes (lazy), sidebar, permissions, scheduledJobs[]
  index.ts
  agentportalApp.tsx
  README.md          ← this mapping + env vars (PLUGIN_AGENTPORTAL_*)
  components/  hooks/  lib/  data/   ← supabase ONLY in data/
  pages/
supabase/migrations/<ts>_plugin_agentportal_init.sql   ← from this folder
supabase/uninstall/agentportal_uninstall.sql           ← from this folder
```

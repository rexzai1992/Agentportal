# QSTUDIO — Third-Party Plugin Developer Guide

> Companion to `QSTUDIO_BRIEF.md` (what the product does). This doc is **how to build inside it without breaking it**.
> Canonical in-repo references: `plugins/PLUGINS.md` (the plugin contract), `plugins/_template/` (starter), `plugins/BUILD_REFERENCE.md`.
> When this guide and `plugins/PLUGINS.md` disagree, `PLUGINS.md` wins.

---

## 1. What you're building into

- **One app, one database.** qstudio is a single React 18 + Vite + TypeScript + Tailwind app on one Supabase (Postgres) project, deployed on Digital Ocean. There are no microservices; plugins are folders inside this app.
- **Multi-tenant.** Many businesses ("companies") share every table. Tenant isolation is enforced **in application code, not in the database**. This is rule #1 below.
- **Plugins are first-class.** Every new capability ships as a plugin under root `plugins/<key>/`, registered in `plugins/registry.ts`, toggleable per company.
- Build with `npm run build` (**vite**). Do not gate on `tsc` — the repo has known type errors. Dev server: `http://localhost:5173/`.

---

## 2. Tenancy — the rules that get a deliverable rejected

**The tenant key is `company_id` (uuid). Every tenant-owned row has it. Every query must filter by it.**

There is **no RLS safety net** you can rely on — if your query forgets `company_id`, it reads/writes other businesses' data and it WILL pass local testing with one tenant. Non-negotiables:

1. **Every `select/update/delete` filters `.eq('company_id', companyId)`** (or goes through a helper that does). No exceptions, including "lookup by unique code" queries.
2. **Every UNIQUE constraint is composite:** `UNIQUE(company_id, <col>)` — never a global `UNIQUE(<col>)`. Global uniques both leak existence across tenants and cause cross-tenant collisions (codes, slugs, phone numbers all repeat across companies).
3. **Every table you create carries `company_id uuid NOT NULL`** + an index on it (policies and lookups both need it).
4. **Naming quirk you must memorize:** the members table is **`merchant_customers`** (historical name) but its tenant column is still `company_id`. Companies live in **`companies`**; per-company plugin activation in **`company_apps`**; route slug is the company's slug (`/:slug/...`). Do not introduce `merchant_id` anywhere new.
5. Cross-tenant admin reads exist only in HQ surfaces — your plugin is not one of them.

**Data conventions:**
- **Phone numbers:** stored and looked up as `60xxxxxxxxx` — digits only, no `+`, MY country code prefixed. Normalize before insert AND before lookup.
- **Timezone:** business day = `Asia/Kuala_Lumpur`. In SQL, day-boundary math needs the double re-anchor: `(ts AT TIME ZONE 'Asia/Kuala_Lumpur')::date` — a single conversion silently shifts days.
- **Loyalty:** `stars_transactions` is the single source of truth for points. Never keep a parallel balance column; derive balances from the ledger. Merchant-facing label comes from `usePointsLabel` (merchants rename "Stars").
- **Counts:** don't trust denormalized counters (e.g. class `enrolled_count` is computed live from bookings). Compute from source rows.

---

## 3. The plugin contract (summary — full text in `plugins/PLUGINS.md`)

**Folder layout (locked):**
```
plugins/<key>/
 definition.ts     ← manifest: routes (lazy), sidebar, permissions, scheduledJobs[], topLevelPublicRoutes[]
 index.ts          ← re-exports definition
 <key>App.tsx      ← <Routes> root
 README.md         ← REQUIRED: what it does, schema, port + uninstall notes
 components/       ← UI; imports from data/ only
 hooks/            ← React hooks; NO direct supabase
 lib/              ← pure helpers; no React, no supabase
 data/             ← THE ONLY layer that may import supabase
 pages/
```

**The `data/`-only rule is absolute:** `supabase` is imported in `data/` and nowhere else. Components/hooks call your `data/` functions. (The platform is keeping its backend swappable; writes will progressively move behind a server API — if you honor this rule, that migration costs you one folder.)

**Namespacing:** every artifact you create is prefixed `plugin_<key>_` — tables, views, indexes, SQL functions, triggers, storage buckets, env vars (`PLUGIN_<KEY>_*`), scheduled-job names. Only shared platform plumbing (e.g. `notification_outbox`, `company_apps`, `usage_ledger`) keeps core names — you consume those, you don't create more.

**A plugin is not done without all four:**
1. `supabase/migrations/<ts>_plugin_<key>_init.sql` — install migration
2. `supabase/uninstall/<key>_uninstall.sql` — full teardown (written day one, not at the end)
3. `plugins/<key>/README.md`
4. `plugins/<key>/definition.ts`

**Activation:** optional plugins are gated by a `company_apps` row (`status` `active`/`trial` ⇒ on). Your plugin must behave correctly when OFF for a company: no sidebar entry, no routes, no slot output, no scheduled work for that tenant. `useActivePlugins()` handles the merge — don't hand-roll checks.

**Scheduled work:** declared in `definition.ts` `scheduledJobs[]` as a SQL function; the scheduler (pg_cron / DO cron / external) is the deployment's choice. Never hard-bind to pg_cron.

**Engineering constraints for new code** (platform direction — deviations rejected in review):
- No new RLS policies, Edge Functions, Supabase Realtime subscriptions, Storage RLS rules, or `SECURITY DEFINER` functions. (The platform team manages database-level security separately.)
- No FKs to `auth.users`.
- Supabase query builders are **not Promises** — never chain `.catch()` on them; use `try/catch` around `await`.

---

## 4. Auth & identity — use what exists, build nothing

- **Members (consumer app):** use `CustomerAuthContext` / `useMemberSession`. Member sessions are **company-scoped** — never read or write another company's session slot, never assume a global "current member."
- **Merchant/staff (back-office):** the merchant `ProtectedRoute` + session context. **HQ auth is scoped to `/myhq` only** — never mount HQ providers app-wide.
- **The login gate is membership, not password.** GoTrue is the single password truth; a user can belong to several companies. Never re-verify passwords per-company, never store password hashes in plugin tables.
- **Never roll your own auth, sessions, tokens, or password handling. Period.** If your feature needs a new identity capability (e.g. device binding for a face terminal), spec it and hand it to the platform owner. Auth is under active hardening; parallel auth code will be rejected outright.
- Public unauthenticated pages are possible via `topLevelPublicRoutes[]` (see the `showcase` and `public_waiver` plugins for the pattern, incl. token-gated public links).

## 5. Routing & surfaces — the traps

- **Verify the route before editing.** Trace URL → `<Route>` → import alias → on-disk path first. Specifically: **`@plugins` resolves to root `plugins/`; the `src/plugins/` page tree contains DEAD copies** (e.g. `src/plugins/qfit/staff` is dead — the real staff app is `plugins/qfit/staff`). Editing the dead copy compiles fine and does nothing.
- **Member-app pages render under TWO bases:** `/:slug/qapp/*` and `/studio/:slug/*`. Never hardcode either — build links with `useQAppBase()`.
- **Custom domains strip the slug.** On a merchant's own domain, routes are slug-less. Never string-concat URLs with the slug; use the platform link helpers, which consult the custom-domain state.
- POS surfaces can render standalone (customer display detects by path and skips the app shell) — if you touch POS, read `plugins/qfit` + POS layout code before assuming the shell exists.

## 6. Product/UX conventions (yes, these are review criteria)

- The internal codename **"qfit" must never appear in any user-facing string**. The product is **"Studio"**; the platform is QSTUDIO. Don't rename code identifiers either — they stay.
- **Cashier-facing POS screens never show absolute RM amounts** — show percentages/progress/ratios. (Money appears on merchant/back-office reports only.)
- Long forms: **Save button at top AND bottom**. No white-on-white controls in the member app (use pill buttons). Brand accent: **#ccff00**.
- Gym-facing copy never says "queue" — use "sign-in sheet" / paperwork terms. Many labels are merchant-overridable (points label, provider titles Trainer/Stylist/Therapist/Doctor) — use the override hooks, don't hardcode.

---

## 7. Guidance for the plugins you're building

### Face scanning
- **Do not create a parallel biometric store or matcher.** The platform already has: `faceid` plugin (enrolment, on-device matching, devices, consent) and `access` plugin (entry events, rules, device control, PDPA consent + erasure, audit). New face hardware/vendors integrate as a **backend to those plugins** — new tables only for vendor-specific device state, `plugin_<key>_` prefixed.
- **PDPA (Malaysia, 2024 Amendment):** biometric data is *sensitive personal data*. Mandatory: explicit consent capture before enrolment, erasure path (and crypto-shred on merchant offboarding), append-only audit of scans/decisions, breach-notifiable handling. Copy the consent/erasure patterns in `access` + `nric` (QVerify) — they exist for this reason.
- Check-in must degrade gracefully to QR/manual when the device is offline — the check-in console already models this; hook into it rather than adding a separate check-in path.

### Agent portal (bulk purchase)
- **Ride the existing commerce spine — do not build a second one.** Catalog = `shop_products` (channel-aware; webstore + member app already share it). Orders = the `shop_orders` pipeline. Memberships activate via the existing order → `activateMembershipsFromOrder` flow (products link plans via `qfit_membership_plan_id`); passes/tickets already support share/claim — bulk allocation should reuse those mechanics, not invent new entitlement tables.
- Agent accounts are a **new role/surface, not a new auth system** (see §4). Commissions for agents should extend the existing commissions engine (`kind` discriminator pattern) rather than a parallel ledger.
- **Payments only through the existing gateway services** (`paymentGatewayService` routing Stripe/Fiuu/WPay). Never call a gateway directly from plugin code; never store card/vcode/checksum secrets client-side. If bulk invoicing needs a new flow, spec it — the payment layer is platform-owned.
- Bulk pricing: respect per-company currency-rounding rules; totals computed server-side/in `data/`, never trusted from the client.

---

## 8. Delivery model — you develop externally; we import

You do **not** work in our repository and you do **not** deploy anything. You build the plugin as a self-contained package; the platform owner imports it, registers it, and applies its SQL.

**What you receive from us:**
- This guide + `QSTUDIO_BRIEF.md` + a copy of `plugins/PLUGINS.md`
- The three contract packages, byte-exact: `packages/platform-contract`, `packages/plugin-registry`, `packages/plugin-sdk` (build against these — do not modify them)
- `plugins/_template/` as your starting skeleton, plus 1–2 existing plugins as reference implementations
- Seed SQL with **at least two companies** — every feature must be tested cross-tenant before delivery

**What you deliver back (the whole deliverable — nothing else will be merged):**
1. One folder: `plugins/<key>/` — self-contained, following the §3 layout, importing only from your own folder, the three contract packages, and the app's public helpers named in this guide
2. `plugin_<key>_init.sql` — the install migration (idempotent where possible)
3. `<key>_uninstall.sql` — the full teardown twin
4. `README.md` inside the folder with: schema notes, permissions used, scheduled jobs, **integration notes** (anything you need from the owner at import time — e.g. env vars `PLUGIN_<KEY>_*`, new CJS npm dependencies, settings defaults)

**Hard boundaries:**
- **No edits to any file outside `plugins/<key>/`** — no core services, no shared components, no `registry.ts`, no `package.json`. If your plugin genuinely needs a core change or a new shared slot, stop and raise it; the owner makes core changes.
- New npm dependencies: list them in the README with the reason. The owner installs them; CJS packages may also need a `vite.config.ts` `optimizeDeps.include` entry on our side — flag any CJS dep explicitly.
- **You never run DDL against any shared environment.** All SQL is applied by the owner, by hand.

**What happens on import (owner side, for transparency):** copy your folder into `plugins/<key>/` → add the import + `registerPlugin(...)` line in `plugins/registry.ts` → install any listed deps → apply your init SQL by hand → activate for a test company via `company_apps` (or `CORE_PLUGINS` if ever promoted) → build with vite → run the §9 checklist against two seed tenants → test your uninstall script on dev. If any checklist item fails, the folder comes back to you.

## 9. Import acceptance checklist (what we check before your folder is merged)

- [ ] Every query filters `company_id`; tested against 2 seeded companies (cross-tenant read/write attempted and blocked)
- [ ] All uniques composite with `company_id`; all new tables have `company_id NOT NULL` + index
- [ ] `supabase` imported only in `data/`
- [ ] All four plugin artifacts present (migration, uninstall, README, definition)
- [ ] Everything namespaced `plugin_<key>_`
- [ ] Plugin fully inert when not activated for a company
- [ ] No new auth, no Edge Fns/Realtime/Storage-RLS/SECURITY DEFINER, no direct gateway calls
- [ ] Phones normalized `60…`; KL day-boundaries; ledger-derived balances
- [ ] No "qfit" in UI strings; POS cashier screens money-free; links built via helpers (qapp base, custom-domain safe)
- [ ] Long forms: Save top + bottom
- [ ] No files touched outside `plugins/<key>/`; new npm deps + env vars declared in README
- [ ] Uninstall script actually removes everything the init migration created (tested on dev)

**Questions / anything not covered:** ask before building. A 10-minute question is cheaper than a rejected PR — several rules above exist because we paid for them in production.

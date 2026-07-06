-- ============================================================================
-- QSTUDIO plugin install migration: plugin_agentportal
-- Translated from the Offline-Ota Agent Portal Prisma schema.
--
-- Contract compliance (plugins/PLUGINS.md):
--   * every table is prefixed plugin_agentportal_
--   * every table carries company_id uuid NOT NULL + an index on it
--   * every UNIQUE is composite with company_id (rule #2 — no global uniques)
--   * enums are TEXT + CHECK constraints (no custom types → clean uninstall)
--   * no FKs to auth.users; user/actor references are soft uuid/text columns
--   * product references are soft ids intended to point at shop_products
--   * idempotent: IF NOT EXISTS everywhere
--
-- Row ids are TEXT (cuid) so data exported from Offline-Ota
-- (scripts/export-data.mjs) imports 1:1 without id remapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Accounts (the agent/partner party — replaces Offline-Ota `Agent` portal part)
-- Auth/link to a real member is the platform owner's job (member_id soft ref).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_accounts (
  id               TEXT PRIMARY KEY,
  company_id       UUID NOT NULL,
  member_id        UUID,                                   -- soft ref → merchant_customers
  party_type       TEXT NOT NULL DEFAULT 'AGENT' CHECK (party_type IN ('AGENT','PARTNER')),
  account_code     TEXT,
  company_name     TEXT NOT NULL,
  contact_name     TEXT,
  phone            TEXT,                                   -- store 60xxxxxxxxx digits only
  email            TEXT NOT NULL,
  registration_no  TEXT,
  kpl_license_no   TEXT,
  kpl_expiry_date  TIMESTAMPTZ,
  fax              TEXT,
  address_line1    TEXT,
  address_line2    TEXT,
  address_line3    TEXT,
  postcode         TEXT,
  country          TEXT,
  state            TEXT,
  target_market    TEXT,
  sales_channel    TEXT,
  account_status   TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE','INACTIVE','EXPIRED')),
  account_expiry   TIMESTAMPTZ,
  registration_id  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, account_code),
  UNIQUE (company_id, email)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_accounts_company ON plugin_agentportal_accounts (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_accounts_party ON plugin_agentportal_accounts (company_id, party_type);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_accounts_status ON plugin_agentportal_accounts (company_id, account_status);

-- ----------------------------------------------------------------------------
-- Registrations (pre-account applications)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_registrations (
  id                  TEXT PRIMARY KEY,
  company_id          UUID NOT NULL,
  application_id      TEXT NOT NULL,
  party_type          TEXT NOT NULL CHECK (party_type IN ('AGENT','PARTNER')),
  company_name        TEXT NOT NULL,
  registration_no     TEXT NOT NULL,
  email               TEXT NOT NULL,
  kpl_license_no      TEXT,
  kpl_expiry_date     TIMESTAMPTZ,
  contact_no          TEXT NOT NULL,
  fax                 TEXT,
  address_line1       TEXT NOT NULL,
  address_line2       TEXT NOT NULL,
  address_line3       TEXT,
  postcode            TEXT NOT NULL,
  country             TEXT NOT NULL,
  state               TEXT NOT NULL,
  target_market       TEXT,
  sales_channel       TEXT,
  terms_accepted_at   TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
  remarks             TEXT,
  reviewed_by         TEXT,                                -- soft actor ref
  reviewed_at         TIMESTAMPTZ,
  created_account_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, application_id)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_registrations_company ON plugin_agentportal_registrations (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_registrations_queue ON plugin_agentportal_registrations (company_id, status, party_type);

-- ----------------------------------------------------------------------------
-- Contact persons (registration or account owned)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_contact_persons (
  id              TEXT PRIMARY KEY,
  company_id      UUID NOT NULL,
  account_id      TEXT REFERENCES plugin_agentportal_accounts(id) ON DELETE CASCADE,
  registration_id TEXT REFERENCES plugin_agentportal_registrations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  designation     TEXT,
  email           TEXT,
  phone           TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_contact_persons_company ON plugin_agentportal_contact_persons (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_contact_persons_account ON plugin_agentportal_contact_persons (account_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_contact_persons_registration ON plugin_agentportal_contact_persons (registration_id);

-- ----------------------------------------------------------------------------
-- Documents (KPL/SSM/payment slips/announcement media)
-- storage_path points at the plugin's own storage bucket (plugin_agentportal_docs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_documents (
  id              TEXT PRIMARY KEY,
  company_id      UUID NOT NULL,
  owner_type      TEXT NOT NULL CHECK (owner_type IN ('REGISTRATION','AGENT','RENEWAL','OFFLINE_PAYMENT','ANNOUNCEMENT')),
  owner_id        TEXT,
  account_id      TEXT REFERENCES plugin_agentportal_accounts(id) ON DELETE SET NULL,
  registration_id TEXT REFERENCES plugin_agentportal_registrations(id) ON DELETE CASCADE,
  renewal_id      TEXT,
  doc_type        TEXT NOT NULL CHECK (doc_type IN ('KPL','SSM','PAYMENT_SLIP','ANNOUNCEMENT_MEDIA','OTHER')),
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  license_no      TEXT,
  expiry_date     TIMESTAMPTZ,
  uploaded_by     TEXT,                                    -- soft actor ref
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_documents_company ON plugin_agentportal_documents (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_documents_owner ON plugin_agentportal_documents (company_id, owner_type, owner_id);

-- ----------------------------------------------------------------------------
-- Renewal requests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_renewal_requests (
  id              TEXT PRIMARY KEY,
  company_id      UUID NOT NULL,
  account_id      TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE CASCADE,
  kpl_license_no  TEXT,
  kpl_expiry_date TIMESTAMPTZ,
  ssm_expiry_date TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
  remarks         TEXT,
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_renewals_company ON plugin_agentportal_renewal_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_renewals_status ON plugin_agentportal_renewal_requests (company_id, status);

-- ----------------------------------------------------------------------------
-- Announcements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_announcements (
  id                TEXT PRIMARY KEY,
  company_id        UUID NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  media_document_id TEXT,
  display_type      TEXT NOT NULL CHECK (display_type IN ('HOME','LOGIN')),
  audience          TEXT NOT NULL DEFAULT 'BOTH' CHECK (audience IN ('AGENT','PARTNER','BOTH')),
  effective_date    TIMESTAMPTZ NOT NULL,
  expiry_date       TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','EXPIRED')),
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_announcements_company ON plugin_agentportal_announcements (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_announcements_display ON plugin_agentportal_announcements (company_id, display_type, audience, status);

-- ----------------------------------------------------------------------------
-- Purchase schemes (+ revisions, products, bindings)
-- product_id is a soft reference to shop_products (the QSTUDIO catalog spine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_schemes (
  id           TEXT PRIMARY KEY,
  company_id   UUID NOT NULL,
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  organisation TEXT,
  status       TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_schemes_company ON plugin_agentportal_schemes (company_id);

CREATE TABLE IF NOT EXISTS plugin_agentportal_scheme_revisions (
  id              TEXT PRIMARY KEY,
  company_id      UUID NOT NULL,
  scheme_id       TEXT NOT NULL REFERENCES plugin_agentportal_schemes(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  effective_date  TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, scheme_id, revision_number)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_revisions_company ON plugin_agentportal_scheme_revisions (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_revisions_scheme ON plugin_agentportal_scheme_revisions (scheme_id, effective_date);

CREATE TABLE IF NOT EXISTS plugin_agentportal_scheme_products (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  scheme_revision_id TEXT NOT NULL REFERENCES plugin_agentportal_scheme_revisions(id) ON DELETE CASCADE,
  product_id         TEXT NOT NULL,                        -- soft ref → shop_products.id
  price              NUMERIC(12,2) NOT NULL,
  min_qty            INTEGER NOT NULL DEFAULT 1,
  max_qty            INTEGER,
  incentive_rate     NUMERIC(5,2),
  discount_rate      NUMERIC(5,2)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_products_company ON plugin_agentportal_scheme_products (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_products_revision ON plugin_agentportal_scheme_products (scheme_revision_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_products_product ON plugin_agentportal_scheme_products (product_id);

CREATE TABLE IF NOT EXISTS plugin_agentportal_scheme_assignments (
  id             TEXT PRIMARY KEY,
  company_id     UUID NOT NULL,
  scheme_id      TEXT NOT NULL REFERENCES plugin_agentportal_schemes(id) ON DELETE CASCADE,
  account_id     TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE CASCADE,
  binding_type   TEXT NOT NULL DEFAULT 'STANDARD' CHECK (binding_type IN ('STANDARD','SPECIAL')),
  incentive      TEXT,
  assigned_by    TEXT,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, scheme_id, account_id, binding_type)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_assignments_company ON plugin_agentportal_scheme_assignments (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_scheme_assignments_account ON plugin_agentportal_scheme_assignments (account_id);

-- ----------------------------------------------------------------------------
-- Purchase orders (wholesale cart) — if the deployment prefers to ride
-- shop_orders end-to-end, keep this table as the portal-specific order state
-- and store the shop_orders id in shop_order_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_purchase_orders (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  order_reference    TEXT NOT NULL,
  account_id         TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE RESTRICT,
  scheme_revision_id TEXT REFERENCES plugin_agentportal_scheme_revisions(id) ON DELETE SET NULL,
  shop_order_id      UUID,                                 -- soft ref → shop_orders (optional integration)
  status             TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_PAYMENT','PENDING_APPROVAL','ORDER_CONFIRMED','REJECTED','REVISION','CANCELLED')),
  subtotal           NUMERIC(12,2) NOT NULL DEFAULT 0,
  incentive_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_payable      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, order_reference)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_purchase_orders_company ON plugin_agentportal_purchase_orders (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_purchase_orders_account ON plugin_agentportal_purchase_orders (company_id, account_id, status);

CREATE TABLE IF NOT EXISTS plugin_agentportal_purchase_order_items (
  id                TEXT PRIMARY KEY,
  company_id        UUID NOT NULL,
  purchase_order_id TEXT NOT NULL REFERENCES plugin_agentportal_purchase_orders(id) ON DELETE CASCADE,
  product_id        TEXT NOT NULL,                         -- soft ref → shop_products.id
  scheme_product_id TEXT,
  quantity          INTEGER NOT NULL,
  unit_price        NUMERIC(12,2) NOT NULL,
  line_total        NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_po_items_company ON plugin_agentportal_purchase_order_items (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_po_items_order ON plugin_agentportal_purchase_order_items (purchase_order_id);

-- ----------------------------------------------------------------------------
-- Offline payments (Agent submits slip → Finance marks paid → Admin approves)
-- NOTE: online payments must go through paymentGatewayService — this table is
-- only for the manual bank-transfer flow.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_payment_groups (
  id         TEXT PRIMARY KEY,
  company_id UUID NOT NULL,
  name       TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (company_id, name)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_payment_groups_company ON plugin_agentportal_payment_groups (company_id);

CREATE TABLE IF NOT EXISTS plugin_agentportal_payment_types (
  id         TEXT PRIMARY KEY,
  company_id UUID NOT NULL,
  name       TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (company_id, name)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_payment_types_company ON plugin_agentportal_payment_types (company_id);

CREATE TABLE IF NOT EXISTS plugin_agentportal_offline_payments (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  account_id         TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE RESTRICT,
  payment_group_id   TEXT REFERENCES plugin_agentportal_payment_groups(id) ON DELETE SET NULL,
  payment_type_id    TEXT REFERENCES plugin_agentportal_payment_types(id) ON DELETE SET NULL,
  amount             NUMERIC(12,2) NOT NULL,
  bank_reference     TEXT,
  bank_name          TEXT,
  slip_document_id   TEXT,
  status             TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL','ORDER_CONFIRMED','REJECTED','REVISION')),
  submitted_by       TEXT,
  finance_paid_by    TEXT,
  finance_paid_at    TIMESTAMPTZ,
  admin_approved_by  TEXT,
  admin_approved_at  TIMESTAMPTZ,
  remarks            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_offline_payments_company ON plugin_agentportal_offline_payments (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_offline_payments_status ON plugin_agentportal_offline_payments (company_id, status);

CREATE TABLE IF NOT EXISTS plugin_agentportal_offline_payment_orders (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  offline_payment_id TEXT NOT NULL REFERENCES plugin_agentportal_offline_payments(id) ON DELETE CASCADE,
  purchase_order_id  TEXT NOT NULL REFERENCES plugin_agentportal_purchase_orders(id) ON DELETE CASCADE,
  UNIQUE (company_id, offline_payment_id, purchase_order_id)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_opo_company ON plugin_agentportal_offline_payment_orders (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_opo_order ON plugin_agentportal_offline_payment_orders (purchase_order_id);

CREATE TABLE IF NOT EXISTS plugin_agentportal_payment_status_history (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  offline_payment_id TEXT NOT NULL REFERENCES plugin_agentportal_offline_payments(id) ON DELETE CASCADE,
  from_status        TEXT,
  to_status          TEXT NOT NULL,
  actor              TEXT,
  remarks            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_psh_company ON plugin_agentportal_payment_status_history (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_psh_payment ON plugin_agentportal_payment_status_history (offline_payment_id);

-- ----------------------------------------------------------------------------
-- Complimentary grants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_complimentary_grants (
  id                 TEXT PRIMARY KEY,
  company_id         UUID NOT NULL,
  account_id         TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE RESTRICT,
  scheme_revision_id TEXT,
  quantity           INTEGER NOT NULL,
  reason             TEXT,
  status             TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
  created_by         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_comp_grants_company ON plugin_agentportal_complimentary_grants (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_comp_grants_account ON plugin_agentportal_complimentary_grants (account_id);

-- ----------------------------------------------------------------------------
-- Vouchers (issued units with serial + QR; redeem New/Locked/Redeemed/Expired)
-- NOTE: if the deployment prefers the existing pass/claim entitlement spine,
-- treat this as the portal-facing projection and link via entitlement_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plugin_agentportal_vouchers (
  id                     TEXT PRIMARY KEY,
  company_id             UUID NOT NULL,
  serial_no              TEXT NOT NULL,
  qr_token               TEXT NOT NULL,
  source                 TEXT NOT NULL CHECK (source IN ('PURCHASE','COMPLIMENTARY')),
  purchase_order_id      TEXT REFERENCES plugin_agentportal_purchase_orders(id) ON DELETE SET NULL,
  complimentary_grant_id TEXT REFERENCES plugin_agentportal_complimentary_grants(id) ON DELETE SET NULL,
  product_id             TEXT NOT NULL,                    -- soft ref → shop_products.id
  account_id             TEXT NOT NULL REFERENCES plugin_agentportal_accounts(id) ON DELETE RESTRICT,
  entitlement_id         UUID,                             -- soft ref → platform pass/entitlement (optional)
  effective_date         TIMESTAMPTZ NOT NULL,
  expiry_date            TIMESTAMPTZ NOT NULL,
  redeem_status          TEXT NOT NULL DEFAULT 'NEW' CHECK (redeem_status IN ('NEW','LOCKED','REDEEMED','EXPIRED')),
  redeemed_at            TIMESTAMPTZ,
  redeemed_by            TEXT,
  entrance_gate          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, serial_no),
  UNIQUE (company_id, qr_token)
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_vouchers_company ON plugin_agentportal_vouchers (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_vouchers_account ON plugin_agentportal_vouchers (company_id, account_id, redeem_status);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_vouchers_order ON plugin_agentportal_vouchers (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_vouchers_expiry ON plugin_agentportal_vouchers (expiry_date);

CREATE TABLE IF NOT EXISTS plugin_agentportal_voucher_redemptions (
  id            TEXT PRIMARY KEY,
  company_id    UUID NOT NULL,
  voucher_id    TEXT NOT NULL REFERENCES plugin_agentportal_vouchers(id) ON DELETE CASCADE,
  entrance_gate TEXT,
  staff         TEXT,                                      -- soft actor ref
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_voucher_redemptions_company ON plugin_agentportal_voucher_redemptions (company_id);
CREATE INDEX IF NOT EXISTS idx_plugin_agentportal_voucher_redemptions_voucher ON plugin_agentportal_voucher_redemptions (voucher_id);

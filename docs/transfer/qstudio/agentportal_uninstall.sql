-- ============================================================================
-- QSTUDIO plugin uninstall: plugin_agentportal
-- Full teardown twin of plugin_agentportal_init.sql.
-- Drops children before parents; removes everything the init created.
-- ============================================================================

DROP TABLE IF EXISTS plugin_agentportal_voucher_redemptions;
DROP TABLE IF EXISTS plugin_agentportal_vouchers;
DROP TABLE IF EXISTS plugin_agentportal_complimentary_grants;
DROP TABLE IF EXISTS plugin_agentportal_payment_status_history;
DROP TABLE IF EXISTS plugin_agentportal_offline_payment_orders;
DROP TABLE IF EXISTS plugin_agentportal_offline_payments;
DROP TABLE IF EXISTS plugin_agentportal_payment_types;
DROP TABLE IF EXISTS plugin_agentportal_payment_groups;
DROP TABLE IF EXISTS plugin_agentportal_purchase_order_items;
DROP TABLE IF EXISTS plugin_agentportal_purchase_orders;
DROP TABLE IF EXISTS plugin_agentportal_scheme_assignments;
DROP TABLE IF EXISTS plugin_agentportal_scheme_products;
DROP TABLE IF EXISTS plugin_agentportal_scheme_revisions;
DROP TABLE IF EXISTS plugin_agentportal_schemes;
DROP TABLE IF EXISTS plugin_agentportal_announcements;
DROP TABLE IF EXISTS plugin_agentportal_renewal_requests;
DROP TABLE IF EXISTS plugin_agentportal_documents;
DROP TABLE IF EXISTS plugin_agentportal_contact_persons;
DROP TABLE IF EXISTS plugin_agentportal_registrations;
DROP TABLE IF EXISTS plugin_agentportal_accounts;

-- Storage: if a plugin_agentportal_docs bucket was created at import time,
-- the platform owner removes it (bucket creation is owner-applied, not in init).

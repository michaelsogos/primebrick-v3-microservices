-- Primebrick: entity → database patch
-- generatedAt: 2026-11-13T17:58:48.999Z

ALTER TABLE "crm"."local_addresses" ADD COLUMN IF NOT EXISTS "cloned_from" uuid;
ALTER TABLE "crm"."local_addresses" ADD COLUMN IF NOT EXISTS "cloned_at" timestamptz;
ALTER TABLE "crm"."local_addresses" ADD COLUMN IF NOT EXISTS "cloned_by" text;
ALTER TABLE "crm"."customer_accounts" ADD COLUMN IF NOT EXISTS "cloned_from" uuid;
ALTER TABLE "crm"."customer_accounts" ADD COLUMN IF NOT EXISTS "cloned_at" timestamptz;
ALTER TABLE "crm"."customer_accounts" ADD COLUMN IF NOT EXISTS "cloned_by" text;
ALTER TABLE "crm"."customer_contacts" ADD COLUMN IF NOT EXISTS "cloned_from" uuid;
ALTER TABLE "crm"."customer_contacts" ADD COLUMN IF NOT EXISTS "cloned_at" timestamptz;
ALTER TABLE "crm"."customer_contacts" ADD COLUMN IF NOT EXISTS "cloned_by" text;
-- WARN: DB-only index "local_addresses_customer_uuid_idx" on crm.local_addresses — not dropped
-- WARN: DB-only index "local_addresses_type_idx" on crm.local_addresses — not dropped
-- WARN: DB-only foreign key "local_addresses_customer_uuid_fkey" on crm.local_addresses — not dropped
-- WARN: DB-only index "customer_accounts_customer_uuid_idx" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_customer_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_local_address_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_contact_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only index "customer_contacts_customer_uuid_idx" on crm.customer_contacts — not dropped
-- WARN: DB-only index "customer_contacts_type_idx" on crm.customer_contacts — not dropped
-- WARN: DB-only foreign key "customer_contacts_customer_uuid_fkey" on crm.customer_contacts — not dropped

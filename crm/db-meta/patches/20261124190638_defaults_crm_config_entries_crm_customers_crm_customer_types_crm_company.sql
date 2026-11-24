-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:06:38.385Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customers" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customers" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_types" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_types" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."legal_forms" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."legal_forms" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."local_address_types" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."local_address_types" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."qualifications" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."qualifications" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."marketing_qualifications" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."marketing_qualifications" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."contact_types" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."contact_types" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."account_kinds" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."account_kinds" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_link_types" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_link_types" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."consent_types" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."consent_types" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."local_addresses" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."local_addresses" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_accounts" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_accounts" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_contacts" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_contacts" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_consents" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_consents" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_links" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."customer_links" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "crm"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();

-- WARN: DB-only index "local_addresses_type_idx" on crm.local_addresses — not dropped
-- WARN: DB-only index "local_addresses_customer_uuid_idx" on crm.local_addresses — not dropped
-- WARN: DB-only foreign key "local_addresses_customer_uuid_fkey" on crm.local_addresses — not dropped
-- WARN: DB-only index "customer_accounts_customer_uuid_idx" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_customer_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_local_address_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only foreign key "customer_accounts_contact_uuid_fkey" on crm.customer_accounts — not dropped
-- WARN: DB-only index "customer_contacts_type_idx" on crm.customer_contacts — not dropped
-- WARN: DB-only index "customer_contacts_customer_uuid_idx" on crm.customer_contacts — not dropped
-- WARN: DB-only foreign key "customer_contacts_customer_uuid_fkey" on crm.customer_contacts — not dropped
-- WARN: DB-only index "customer_consents_customer_uuid_idx" on crm.customer_consents — not dropped
-- WARN: DB-only foreign key "customer_consents_customer_uuid_fkey" on crm.customer_consents — not dropped
-- WARN: DB-only index "customer_links_parent_uuid_idx" on crm.customer_links — not dropped
-- WARN: DB-only index "customer_links_child_uuid_idx" on crm.customer_links — not dropped
-- WARN: DB-only foreign key "customer_links_parent_uuid_fkey" on crm.customer_links — not dropped
-- WARN: DB-only foreign key "customer_links_child_uuid_fkey" on crm.customer_links — not dropped

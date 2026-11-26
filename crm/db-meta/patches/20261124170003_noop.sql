-- Primebrick: entity → database patch
-- pb:requires-review
-- pb:segments
-- generatedAt: 2026-11-24T17:00:03.462Z

-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "config_entries_key_uq" ON "crm"."config_entries" ("key") WHERE deleted_at IS NULL;
-- pb:end-no-transaction

-- ── review section (runs only after approval) ──
-- REVIEW index "customers_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."customers_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "customers_code_uq" ON "crm"."customers" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "customer_types_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."customer_types_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "customer_types_code_uq" ON "crm"."customer_types" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "company_dimensions_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."company_dimensions_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "company_dimensions_code_uq" ON "crm"."company_dimensions" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "legal_forms_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."legal_forms_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "legal_forms_code_uq" ON "crm"."legal_forms" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "local_address_types_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."local_address_types_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "local_address_types_code_uq" ON "crm"."local_address_types" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "qualifications_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."qualifications_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "qualifications_code_uq" ON "crm"."qualifications" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "marketing_qualifications_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."marketing_qualifications_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_qualifications_code_uq" ON "crm"."marketing_qualifications" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "contact_types_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."contact_types_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "contact_types_code_uq" ON "crm"."contact_types" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "account_kinds_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."account_kinds_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "account_kinds_code_uq" ON "crm"."account_kinds" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "customer_link_types_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."customer_link_types_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "customer_link_types_code_uq" ON "crm"."customer_link_types" ("code") WHERE deleted_at IS NULL;
-- REVIEW index "consent_types_code_uq" redefined (entity using=btree cols=code vs db using=btree cols=code)
DROP INDEX IF EXISTS "crm"."consent_types_code_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "consent_types_code_uq" ON "crm"."consent_types" ("code") WHERE deleted_at IS NULL;

-- WARN: DB-only index "crm_config_entries_key_uq" on crm.config_entries — not dropped
-- manual: legacy-named full-unique orphan — superseded by canonical
-- config_entries_key_uq (created above, partial aliveOnly). Constraint-backed:
-- DROP CONSTRAINT releases the underlying index in one step.
ALTER TABLE "crm"."config_entries" DROP CONSTRAINT IF EXISTS "crm_config_entries_key_uq";

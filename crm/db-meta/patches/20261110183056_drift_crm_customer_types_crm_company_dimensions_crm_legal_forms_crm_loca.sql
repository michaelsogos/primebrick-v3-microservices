-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-10T18:30:56.465Z

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── review section (runs only after approval) ──
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."customer_types" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "min_size" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "min_size" TYPE int4;
-- REVIEW type change "max_size" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "max_size" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."legal_forms" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."local_address_types" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."qualifications" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."marketing_qualifications" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."contact_types" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."account_kinds" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."customer_link_types" ALTER COLUMN "sort" TYPE int4;
-- REVIEW type change "sort" entity≈int4 db≈float8 (may rewrite the table)
ALTER TABLE "crm"."consent_types" ALTER COLUMN "sort" TYPE int4;

-- WARN: DB-only index "legal_forms_country_elf_uidx" on crm.legal_forms — not dropped
-- WARN: DB-only index "legal_forms_country_idx" on crm.legal_forms — not dropped

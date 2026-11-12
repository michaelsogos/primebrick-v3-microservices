-- Primebrick: crm phase-1 — uuidv7 column defaults
-- Handwritten: swap generation default gen_random_uuid() -> uuidv7()
-- on pre-existing uuid columns (default expressions are a differ blind spot).

ALTER TABLE "crm"."account_kinds" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."company_dimensions" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."config_entries" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."consent_types" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."contact_types" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_accounts" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_consents" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_contacts" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_link_types" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_links" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customer_types" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."customers" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."legal_forms" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."local_address_types" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."local_addresses" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."marketing_qualifications" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."qualifications" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "crm"."translations" ALTER COLUMN "uuid" SET DEFAULT uuidv7();

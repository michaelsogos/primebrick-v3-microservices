-- Primebrick: audit rows get a uuidv7 `uuid` row key, PK becomes
-- (uuid, changed_at) and the surrogate bigint `id` is eradicated — same
-- shape the DAL now emits for every {entity}_audit table.
-- ADD COLUMN propagates to partitions; uuidv7() is volatile so existing
-- rows are rewritten with a distinct key each.
--
-- part_config still points customers_audit at its pre-move name
-- 'public.customers_audit' — repoint to 'crm.customers_audit' and drop
-- the stale public template. All existing crm audit templates still
-- carry the dead id/entity_id shape: rebuild each one LIKE its migrated
-- parent so future partitions get the uuid shape. template_crm_customers_audit
-- never existed — create it from the migrated parent.
--
-- Audit retention is intrinsic: every {entity}_audit parent keeps 12
-- months and drops expired partitions (retention_keep_table = false).

ALTER TABLE "crm"."account_kinds_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."account_kinds_audit" DROP CONSTRAINT "account_kinds_audit_pkey";
ALTER TABLE "crm"."account_kinds_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."account_kinds_audit" DROP COLUMN "id";

ALTER TABLE "crm"."company_dimensions_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."company_dimensions_audit" DROP CONSTRAINT "company_dimensions_audit_pkey";
ALTER TABLE "crm"."company_dimensions_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."company_dimensions_audit" DROP COLUMN "id";

ALTER TABLE "crm"."consent_types_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."consent_types_audit" DROP CONSTRAINT "consent_types_audit_pkey";
ALTER TABLE "crm"."consent_types_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."consent_types_audit" DROP COLUMN "id";

ALTER TABLE "crm"."contact_types_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."contact_types_audit" DROP CONSTRAINT "contact_types_audit_pkey";
ALTER TABLE "crm"."contact_types_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."contact_types_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_accounts_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_accounts_audit" DROP CONSTRAINT "customer_accounts_audit_pkey";
ALTER TABLE "crm"."customer_accounts_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_accounts_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_consents_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_consents_audit" DROP CONSTRAINT "customer_consents_audit_pkey";
ALTER TABLE "crm"."customer_consents_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_consents_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_contacts_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_contacts_audit" DROP CONSTRAINT "customer_contacts_audit_pkey";
ALTER TABLE "crm"."customer_contacts_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_contacts_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_links_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_links_audit" DROP CONSTRAINT "customer_links_audit_pkey";
ALTER TABLE "crm"."customer_links_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_links_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_link_types_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_link_types_audit" DROP CONSTRAINT "customer_link_types_audit_pkey";
ALTER TABLE "crm"."customer_link_types_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_link_types_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customers_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customers_audit" DROP CONSTRAINT "customers_audit_pkey";
ALTER TABLE "crm"."customers_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customers_audit" DROP COLUMN "id";

ALTER TABLE "crm"."customer_types_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."customer_types_audit" DROP CONSTRAINT "customer_types_audit_pkey";
ALTER TABLE "crm"."customer_types_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."customer_types_audit" DROP COLUMN "id";

ALTER TABLE "crm"."legal_forms_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."legal_forms_audit" DROP CONSTRAINT "legal_forms_audit_pkey";
ALTER TABLE "crm"."legal_forms_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."legal_forms_audit" DROP COLUMN "id";

ALTER TABLE "crm"."local_addresses_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."local_addresses_audit" DROP CONSTRAINT "local_addresses_audit_pkey";
ALTER TABLE "crm"."local_addresses_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."local_addresses_audit" DROP COLUMN "id";

ALTER TABLE "crm"."local_address_types_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."local_address_types_audit" DROP CONSTRAINT "local_address_types_audit_pkey";
ALTER TABLE "crm"."local_address_types_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."local_address_types_audit" DROP COLUMN "id";

ALTER TABLE "crm"."marketing_qualifications_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."marketing_qualifications_audit" DROP CONSTRAINT "marketing_qualifications_audit_pkey";
ALTER TABLE "crm"."marketing_qualifications_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."marketing_qualifications_audit" DROP COLUMN "id";

ALTER TABLE "crm"."qualifications_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "crm"."qualifications_audit" DROP CONSTRAINT "qualifications_audit_pkey";
ALTER TABLE "crm"."qualifications_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "crm"."qualifications_audit" DROP COLUMN "id";

-- part_config repoint: the parent lives in the crm schema, not public.
UPDATE partman.part_config
   SET parent_table = 'crm.customers_audit',
       template_table = 'partman.template_crm_customers_audit'
 WHERE parent_table = 'public.customers_audit';
DROP TABLE IF EXISTS "partman"."template_public_customers_audit";

-- Rebuild every crm audit template from its migrated parent (drops the
-- dead id/entity_id columns future partitions would otherwise inherit)
-- and create the customers template that was never generated.
DROP TABLE IF EXISTS "partman"."template_crm_account_kinds_audit";
CREATE TABLE "partman"."template_crm_account_kinds_audit" (LIKE "crm"."account_kinds_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_company_dimensions_audit";
CREATE TABLE "partman"."template_crm_company_dimensions_audit" (LIKE "crm"."company_dimensions_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_consent_types_audit";
CREATE TABLE "partman"."template_crm_consent_types_audit" (LIKE "crm"."consent_types_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_contact_types_audit";
CREATE TABLE "partman"."template_crm_contact_types_audit" (LIKE "crm"."contact_types_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_accounts_audit";
CREATE TABLE "partman"."template_crm_customer_accounts_audit" (LIKE "crm"."customer_accounts_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_consents_audit";
CREATE TABLE "partman"."template_crm_customer_consents_audit" (LIKE "crm"."customer_consents_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_contacts_audit";
CREATE TABLE "partman"."template_crm_customer_contacts_audit" (LIKE "crm"."customer_contacts_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_links_audit";
CREATE TABLE "partman"."template_crm_customer_links_audit" (LIKE "crm"."customer_links_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_link_types_audit";
CREATE TABLE "partman"."template_crm_customer_link_types_audit" (LIKE "crm"."customer_link_types_audit" INCLUDING ALL);
CREATE TABLE IF NOT EXISTS "partman"."template_crm_customers_audit" (LIKE "crm"."customers_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_customer_types_audit";
CREATE TABLE "partman"."template_crm_customer_types_audit" (LIKE "crm"."customer_types_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_legal_forms_audit";
CREATE TABLE "partman"."template_crm_legal_forms_audit" (LIKE "crm"."legal_forms_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_local_addresses_audit";
CREATE TABLE "partman"."template_crm_local_addresses_audit" (LIKE "crm"."local_addresses_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_local_address_types_audit";
CREATE TABLE "partman"."template_crm_local_address_types_audit" (LIKE "crm"."local_address_types_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_marketing_qualifications_audit";
CREATE TABLE "partman"."template_crm_marketing_qualifications_audit" (LIKE "crm"."marketing_qualifications_audit" INCLUDING ALL);
DROP TABLE IF EXISTS "partman"."template_crm_qualifications_audit";
CREATE TABLE "partman"."template_crm_qualifications_audit" (LIKE "crm"."qualifications_audit" INCLUDING ALL);

UPDATE partman.part_config
   SET retention = '12 months', retention_keep_table = false
 WHERE parent_table IN (
   'crm.account_kinds_audit','crm.company_dimensions_audit','crm.consent_types_audit',
   'crm.contact_types_audit','crm.customer_accounts_audit','crm.customer_consents_audit',
   'crm.customer_contacts_audit','crm.customer_links_audit','crm.customer_link_types_audit',
   'crm.customers_audit','crm.customer_types_audit','crm.legal_forms_audit',
   'crm.local_addresses_audit','crm.local_address_types_audit',
   'crm.marketing_qualifications_audit','crm.qualifications_audit');

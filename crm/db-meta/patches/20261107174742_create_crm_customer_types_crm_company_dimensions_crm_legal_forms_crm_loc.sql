-- Primebrick: entity → database patch
-- generatedAt: 2026-11-07T17:47:42.286Z

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_types_uuid_uq" ON "crm"."customer_types" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_types_code_uq" ON "crm"."customer_types" ("code");

CREATE TABLE IF NOT EXISTS "crm"."customer_types_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_types_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_types_audit_entity_uuid_idx" ON "crm"."customer_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_types_audit_action_idx" ON "crm"."customer_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."company_dimensions" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "min_size" float8 NOT NULL,
  "max_size" float8,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_dimensions_uuid_uq" ON "crm"."company_dimensions" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "company_dimensions_code_uq" ON "crm"."company_dimensions" ("code");

CREATE TABLE IF NOT EXISTS "crm"."company_dimensions_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.company_dimensions_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "company_dimensions_audit_entity_uuid_idx" ON "crm"."company_dimensions_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "company_dimensions_audit_action_idx" ON "crm"."company_dimensions_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."legal_forms" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "country" varchar(2) NOT NULL,
  "elf_code" varchar(4) NOT NULL,
  "name_local" text NOT NULL,
  "name_transliterated" text,
  "abbreviation" varchar(50),
  "status" varchar(10) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "legal_forms_uuid_uq" ON "crm"."legal_forms" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "legal_forms_code_uq" ON "crm"."legal_forms" ("code");

CREATE TABLE IF NOT EXISTS "crm"."legal_forms_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.legal_forms_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "legal_forms_audit_entity_uuid_idx" ON "crm"."legal_forms_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "legal_forms_audit_action_idx" ON "crm"."legal_forms_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."local_address_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "local_address_types_uuid_uq" ON "crm"."local_address_types" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "local_address_types_code_uq" ON "crm"."local_address_types" ("code");

CREATE TABLE IF NOT EXISTS "crm"."local_address_types_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.local_address_types_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "local_address_types_audit_entity_uuid_idx" ON "crm"."local_address_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "local_address_types_audit_action_idx" ON "crm"."local_address_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."qualifications" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "qualifications_uuid_uq" ON "crm"."qualifications" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "qualifications_code_uq" ON "crm"."qualifications" ("code");

CREATE TABLE IF NOT EXISTS "crm"."qualifications_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.qualifications_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "qualifications_audit_entity_uuid_idx" ON "crm"."qualifications_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "qualifications_audit_action_idx" ON "crm"."qualifications_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."marketing_qualifications" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_qualifications_uuid_uq" ON "crm"."marketing_qualifications" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_qualifications_code_uq" ON "crm"."marketing_qualifications" ("code");

CREATE TABLE IF NOT EXISTS "crm"."marketing_qualifications_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.marketing_qualifications_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "marketing_qualifications_audit_entity_uuid_idx" ON "crm"."marketing_qualifications_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "marketing_qualifications_audit_action_idx" ON "crm"."marketing_qualifications_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."contact_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "value_kind" varchar(20) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contact_types_uuid_uq" ON "crm"."contact_types" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "contact_types_code_uq" ON "crm"."contact_types" ("code");

CREATE TABLE IF NOT EXISTS "crm"."contact_types_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.contact_types_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "contact_types_audit_entity_uuid_idx" ON "crm"."contact_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "contact_types_audit_action_idx" ON "crm"."contact_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."account_kinds" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "account_kinds_uuid_uq" ON "crm"."account_kinds" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "account_kinds_code_uq" ON "crm"."account_kinds" ("code");

CREATE TABLE IF NOT EXISTS "crm"."account_kinds_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.account_kinds_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "account_kinds_audit_entity_uuid_idx" ON "crm"."account_kinds_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "account_kinds_audit_action_idx" ON "crm"."account_kinds_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_link_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_link_types_uuid_uq" ON "crm"."customer_link_types" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_link_types_code_uq" ON "crm"."customer_link_types" ("code");

CREATE TABLE IF NOT EXISTS "crm"."customer_link_types_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_link_types_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_link_types_audit_entity_uuid_idx" ON "crm"."customer_link_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_link_types_audit_action_idx" ON "crm"."customer_link_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."consent_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" float8 NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "consent_types_uuid_uq" ON "crm"."consent_types" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "consent_types_code_uq" ON "crm"."consent_types" ("code");

CREATE TABLE IF NOT EXISTS "crm"."consent_types_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.consent_types_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "consent_types_audit_entity_uuid_idx" ON "crm"."consent_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "consent_types_audit_action_idx" ON "crm"."consent_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."local_addresses" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  "street" text NOT NULL,
  "civic" varchar(20),
  "postal_code" varchar(20) NOT NULL,
  "city" text NOT NULL,
  "province" text,
  "country" varchar(2) NOT NULL,
  "lat" float8,
  "lng" float8,
  "poi_name" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "local_addresses_uuid_uq" ON "crm"."local_addresses" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."local_addresses_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.local_addresses_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "local_addresses_audit_entity_uuid_idx" ON "crm"."local_addresses_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "local_addresses_audit_action_idx" ON "crm"."local_addresses_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_accounts" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "kind_uuid" uuid NOT NULL,
  "company_name" text NOT NULL,
  "legal_form_uuid" uuid,
  "country" varchar(2) NOT NULL,
  "local_address_id" int8,
  "contact_id" int8,
  "is_default" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_accounts_uuid_uq" ON "crm"."customer_accounts" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."customer_accounts_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_accounts_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_accounts_audit_entity_uuid_idx" ON "crm"."customer_accounts_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_accounts_audit_action_idx" ON "crm"."customer_accounts_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_contacts" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  "value" text NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "label" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_contacts_uuid_uq" ON "crm"."customer_contacts" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."customer_contacts_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_contacts_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_contacts_audit_entity_uuid_idx" ON "crm"."customer_contacts_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_contacts_audit_action_idx" ON "crm"."customer_contacts_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_consents" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  "doc_version" varchar(50) NOT NULL,
  "granted_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "channel" varchar(50),
  "ip" varchar(45),
  "user_agent" text,
  "seal" varchar(64) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_consents_uuid_uq" ON "crm"."customer_consents" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."customer_consents_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_consents_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_consents_audit_entity_uuid_idx" ON "crm"."customer_consents_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_consents_audit_action_idx" ON "crm"."customer_consents_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_links" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL DEFAULT 'system',
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "parent_customer_id" int8 NOT NULL,
  "child_customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_links_uuid_uq" ON "crm"."customer_links" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."customer_links_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.customer_links_audit', 'changed_at', '1 month');

CREATE INDEX IF NOT EXISTS "customer_links_audit_entity_uuid_idx" ON "crm"."customer_links_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_links_audit_action_idx" ON "crm"."customer_links_audit" ("action");

-- ─── True FK constraints (children → customer CASCADE; account → LU/contact RESTRICT) ──
ALTER TABLE "crm"."local_addresses"  ADD CONSTRAINT "local_addresses_customer_fk"    FOREIGN KEY ("customer_id")        REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_contacts" ADD CONSTRAINT "customer_contacts_customer_fk" FOREIGN KEY ("customer_id")        REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_consents" ADD CONSTRAINT "customer_consents_customer_fk" FOREIGN KEY ("customer_id")        REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_accounts" ADD CONSTRAINT "customer_accounts_customer_fk" FOREIGN KEY ("customer_id")        REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_accounts" ADD CONSTRAINT "customer_accounts_address_fk"  FOREIGN KEY ("local_address_id")   REFERENCES "crm"."local_addresses"("id") ON DELETE RESTRICT;
ALTER TABLE "crm"."customer_accounts" ADD CONSTRAINT "customer_accounts_contact_fk"  FOREIGN KEY ("contact_id")         REFERENCES "crm"."customer_contacts"("id") ON DELETE RESTRICT;
ALTER TABLE "crm"."customer_links"   ADD CONSTRAINT "customer_links_parent_fk"       FOREIGN KEY ("parent_customer_id") REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_links"   ADD CONSTRAINT "customer_links_child_fk"        FOREIGN KEY ("child_customer_id")  REFERENCES "crm"."customers"("id")       ON DELETE CASCADE;
ALTER TABLE "crm"."customer_links"   ADD CONSTRAINT "customer_links_no_self_chk"     CHECK ("parent_customer_id" <> "child_customer_id");

-- ─── One default per (customer,type) / per customer — partial uniques ──
CREATE UNIQUE INDEX IF NOT EXISTS "customer_contacts_default_uidx"
  ON "crm"."customer_contacts" ("customer_id", "type_uuid")
  WHERE "is_default" AND "deleted_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "customer_accounts_default_uidx"
  ON "crm"."customer_accounts" ("customer_id")
  WHERE "is_default" AND "deleted_at" IS NULL;

-- ─── Same address may exist globally but not twice per customer (normalized dedupe) ──
CREATE UNIQUE INDEX IF NOT EXISTS "local_addresses_dedupe_uidx"
  ON "crm"."local_addresses" ("customer_id", lower("street"), COALESCE("civic", ''), "postal_code", lower("city"), "country")
  WHERE "deleted_at" IS NULL;

-- ─── One typed edge per (parent,child) — multi-typed relations allowed ──
CREATE UNIQUE INDEX IF NOT EXISTS "customer_links_edge_uidx"
  ON "crm"."customer_links" ("parent_customer_id", "child_customer_id", "type_uuid")
  WHERE "deleted_at" IS NULL;

-- ─── legal_forms: source integrity + cascade pivot index ──
CREATE UNIQUE INDEX IF NOT EXISTS "legal_forms_country_elf_uidx"
  ON "crm"."legal_forms" ("country", "elf_code")
  WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "legal_forms_country_idx" ON "crm"."legal_forms" ("country") WHERE "deleted_at" IS NULL;

-- ─── FK / ref lookup indexes ──
CREATE INDEX IF NOT EXISTS "local_addresses_customer_idx"  ON "crm"."local_addresses"  ("customer_id")  WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "local_addresses_type_idx"      ON "crm"."local_addresses"  ("type_uuid")    WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_accounts_customer_idx" ON "crm"."customer_accounts" ("customer_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_contacts_customer_idx" ON "crm"."customer_contacts" ("customer_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_contacts_type_idx"    ON "crm"."customer_contacts" ("type_uuid")   WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_consents_customer_idx" ON "crm"."customer_consents" ("customer_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_links_parent_idx"     ON "crm"."customer_links"   ("parent_customer_id") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "customer_links_child_idx"      ON "crm"."customer_links"   ("child_customer_id")  WHERE "deleted_at" IS NULL;

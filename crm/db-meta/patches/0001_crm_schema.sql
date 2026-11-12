-- 0001 — crm schema baseline: consolidated 'as if first time' shape.
-- Replaces the accumulated 0001-0008 + 20261107-20261205 delta chain.
-- Entity-generated section: all registry-declared tables, partman-managed
-- *_audit partitions, declared indexes. Handwritten supplement: objects the
-- entity registry cannot declare — crm.translations (BE-gateway-owned CRUD),
-- FK constraints (until @Ref declarations land), CHECK constraints, and
-- partial/expression indexes.

-- ─── Platform extensions ────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "partman";
CREATE EXTENSION IF NOT EXISTS "pg_partman" SCHEMA "partman";

-- ─── Entity tables, indexes, audit partitions (entity-declared) ─────────

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."config_entries" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text,
  "type" varchar(50) NOT NULL,
  "type_config" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "reserved" boolean NOT NULL,
  "group_key" varchar(100),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_uuid_uq" ON "crm"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "crm"."config_entries" ("key");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customers" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(20) NOT NULL,
  "display_name" text,
  "customer_type_uuid" uuid,
  "qualification_uuid" uuid,
  "marketing_qualification_uuid" uuid,
  "company_dimension_uuid" uuid,
  "status" text NOT NULL,
  "status_reason" text,
  "onboarding_at" timestamptz,
  "onboarding_time_zone" varchar(100),
  "preferred_locale" varchar(35),
  "cloned_from" uuid,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_uuid_uq" ON "crm"."customers" ("uuid");

CREATE TABLE IF NOT EXISTS "crm"."customers_audit" (
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

SELECT partman.create_parent('crm.customers_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customers_audit_entity_uuid_idx" ON "crm"."customers_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customers_audit_action_idx" ON "crm"."customers_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "sort" int4 NOT NULL,
  "label_key" varchar(100) NOT NULL,
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

SELECT partman.create_parent('crm.customer_types_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_types_audit_entity_uuid_idx" ON "crm"."customer_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_types_audit_action_idx" ON "crm"."customer_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."company_dimensions" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "min_size" int4 NOT NULL,
  "max_size" int4,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.company_dimensions_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "company_dimensions_audit_entity_uuid_idx" ON "crm"."company_dimensions_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "company_dimensions_audit_action_idx" ON "crm"."company_dimensions_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."legal_forms" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
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
  "abbreviation" text,
  "status" varchar(10) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.legal_forms_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "legal_forms_audit_entity_uuid_idx" ON "crm"."legal_forms_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "legal_forms_audit_action_idx" ON "crm"."legal_forms_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."local_address_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.local_address_types_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "local_address_types_audit_entity_uuid_idx" ON "crm"."local_address_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "local_address_types_audit_action_idx" ON "crm"."local_address_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."qualifications" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.qualifications_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "qualifications_audit_entity_uuid_idx" ON "crm"."qualifications_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "qualifications_audit_action_idx" ON "crm"."qualifications_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."marketing_qualifications" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.marketing_qualifications_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "marketing_qualifications_audit_entity_uuid_idx" ON "crm"."marketing_qualifications_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "marketing_qualifications_audit_action_idx" ON "crm"."marketing_qualifications_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."contact_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "value_kind" varchar(20) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.contact_types_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "contact_types_audit_entity_uuid_idx" ON "crm"."contact_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "contact_types_audit_action_idx" ON "crm"."contact_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."account_kinds" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.account_kinds_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "account_kinds_audit_entity_uuid_idx" ON "crm"."account_kinds_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "account_kinds_audit_action_idx" ON "crm"."account_kinds_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_link_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.customer_link_types_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_link_types_audit_entity_uuid_idx" ON "crm"."customer_link_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_link_types_audit_action_idx" ON "crm"."customer_link_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."consent_types" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(50) NOT NULL,
  "label_key" varchar(100) NOT NULL,
  "sort" int4 NOT NULL,
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

SELECT partman.create_parent('crm.consent_types_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "consent_types_audit_entity_uuid_idx" ON "crm"."consent_types_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "consent_types_audit_action_idx" ON "crm"."consent_types_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."local_addresses" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  "street" text NOT NULL,
  "street2" text,
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

SELECT partman.create_parent('crm.local_addresses_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "local_addresses_audit_entity_uuid_idx" ON "crm"."local_addresses_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "local_addresses_audit_action_idx" ON "crm"."local_addresses_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_accounts" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
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
  "is_default" boolean NOT NULL,
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

SELECT partman.create_parent('crm.customer_accounts_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_accounts_audit_entity_uuid_idx" ON "crm"."customer_accounts_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_accounts_audit_action_idx" ON "crm"."customer_accounts_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_contacts" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" int8 NOT NULL,
  "type_uuid" uuid NOT NULL,
  "value" text NOT NULL,
  "is_default" boolean NOT NULL,
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

SELECT partman.create_parent('crm.customer_contacts_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_contacts_audit_entity_uuid_idx" ON "crm"."customer_contacts_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_contacts_audit_action_idx" ON "crm"."customer_contacts_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_consents" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
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

SELECT partman.create_parent('crm.customer_consents_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_consents_audit_entity_uuid_idx" ON "crm"."customer_consents_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_consents_audit_action_idx" ON "crm"."customer_consents_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."customer_links" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
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

SELECT partman.create_parent('crm.customer_links_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "customer_links_audit_entity_uuid_idx" ON "crm"."customer_links_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "customer_links_audit_action_idx" ON "crm"."customer_links_audit" ("action");

-- ─── crm.translations (module-owned i18n, BE gateway CRUD) ──────────────

CREATE TABLE IF NOT EXISTS crm.translations (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    language character varying(10) NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(255) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT translations_key_shape CHECK (((key)::text ~ '^crm(\.[a-z0-9_]+)+$'::text))
);
ALTER TABLE crm.translations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME crm.translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE ONLY crm.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS crm_translations_key_language_uidx ON crm.translations USING btree (key, language) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS crm_translations_language_idx ON crm.translations USING btree (language) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS crm_translations_uuid_uq ON crm.translations USING btree (uuid);

-- ─── Foreign keys (id-keyed today; @Ref + uuid-keyed in phase 2) ────────

ALTER TABLE crm.customer_accounts ADD CONSTRAINT "customer_accounts_address_fk" FOREIGN KEY (local_address_id) REFERENCES crm.local_addresses(id) ON DELETE RESTRICT;
ALTER TABLE crm.customer_accounts ADD CONSTRAINT "customer_accounts_contact_fk" FOREIGN KEY (contact_id) REFERENCES crm.customer_contacts(id) ON DELETE RESTRICT;
ALTER TABLE crm.customer_accounts ADD CONSTRAINT "customer_accounts_customer_fk" FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;
ALTER TABLE crm.customer_consents ADD CONSTRAINT "customer_consents_customer_fk" FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;
ALTER TABLE crm.customer_contacts ADD CONSTRAINT "customer_contacts_customer_fk" FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;
ALTER TABLE crm.customer_links ADD CONSTRAINT "customer_links_child_fk" FOREIGN KEY (child_customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;
ALTER TABLE crm.customer_links ADD CONSTRAINT "customer_links_parent_fk" FOREIGN KEY (parent_customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;
ALTER TABLE crm.local_addresses ADD CONSTRAINT "local_addresses_customer_fk" FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;

-- ─── CHECK constraints ─────────────────────────────────────────────────

ALTER TABLE crm.customer_links ADD CONSTRAINT "customer_links_no_self_chk" CHECK ((parent_customer_id <> child_customer_id));

-- ─── Partial + expression indexes (DB-managed, not entity-declarable) ───

CREATE INDEX IF NOT EXISTS customer_accounts_customer_idx ON crm.customer_accounts USING btree (customer_id) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS customer_accounts_default_uidx ON crm.customer_accounts USING btree (customer_id) WHERE (is_default AND (deleted_at IS NULL));
CREATE INDEX IF NOT EXISTS customer_consents_customer_idx ON crm.customer_consents USING btree (customer_id) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS customer_contacts_customer_idx ON crm.customer_contacts USING btree (customer_id) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS customer_contacts_default_uidx ON crm.customer_contacts USING btree (customer_id, type_uuid) WHERE (is_default AND (deleted_at IS NULL));
CREATE INDEX IF NOT EXISTS customer_contacts_type_idx ON crm.customer_contacts USING btree (type_uuid) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS customer_links_child_idx ON crm.customer_links USING btree (child_customer_id) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS customer_links_edge_uidx ON crm.customer_links USING btree (parent_customer_id, child_customer_id, type_uuid) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS customer_links_parent_idx ON crm.customer_links USING btree (parent_customer_id) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS legal_forms_country_elf_uidx ON crm.legal_forms USING btree (country, elf_code) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS legal_forms_country_idx ON crm.legal_forms USING btree (country) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS local_addresses_customer_idx ON crm.local_addresses USING btree (customer_id) WHERE (deleted_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS local_addresses_dedupe_uidx ON crm.local_addresses USING btree (customer_id, lower(street), COALESCE(lower(street2), ''::text), postal_code, lower(city), country) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS local_addresses_type_idx ON crm.local_addresses USING btree (type_uuid) WHERE (deleted_at IS NULL);

-- 0001 — crm schema: primebrick-crm playground tables.
--
-- config_entries — mandatory microservice config table
-- translations   — module-owned i18n dictionary (BE-managed CRUD via the
--                  central translations gateway; service_registry
--                  discovery → crm.translations)

BEGIN;

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."config_entries" (
  "id"              bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"            uuid NOT NULL DEFAULT gen_random_uuid(),
  "key"             varchar(100) NOT NULL,
  "value"           text,
  "type"            varchar(50) NOT NULL DEFAULT 'string',
  "type_config"     text,
  "label_key"       varchar(100),
  "description_key" varchar(100),
  "reserved"        boolean NOT NULL DEFAULT false,
  "group_key"       varchar(100),
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "created_by"      text NOT NULL DEFAULT 'system',
  "updated_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_by"      text NOT NULL DEFAULT 'system',
  "version"         integer NOT NULL DEFAULT 1,
  "deleted_at"      timestamptz,
  "deleted_by"      text,
  PRIMARY KEY ("id"),
  CONSTRAINT "crm_config_entries_uuid_uq" UNIQUE ("uuid"),
  CONSTRAINT "crm_config_entries_key_uq" UNIQUE ("key")
);

CREATE TABLE IF NOT EXISTS "crm"."translations" (
  "id"         bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"       uuid NOT NULL DEFAULT gen_random_uuid(),
  "key"        varchar(255) NOT NULL,
  "language"   varchar(10) NOT NULL,
  "value"      text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "created_by" varchar(255) NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" varchar(255) NOT NULL,
  "version"    integer NOT NULL DEFAULT 1,
  "deleted_at" timestamptz,
  "deleted_by" varchar(255),
  PRIMARY KEY ("id"),
  CONSTRAINT "crm_translations_uuid_uq" UNIQUE ("uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_translations_key_language_uidx"
  ON "crm"."translations" ("key", "language")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "crm_translations_language_idx"
  ON "crm"."translations" ("language")
  WHERE "deleted_at" IS NULL;

COMMIT;

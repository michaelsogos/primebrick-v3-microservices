-- emailsender patch: add generic config dictionary table + rename email_config → providers.
-- Runs AFTER 20260528114750_create_emailsender_email_config_emailsender_email_templates.sql.
-- On an existing DB: renames email_config → providers (preserving data).
-- On a fresh DB: the first patch creates email_config, this patch renames it to providers.

-- 1. Rename email_config → providers (if it exists from the previous patch)
ALTER TABLE IF EXISTS "emailsender"."email_config" RENAME TO "providers";
ALTER INDEX IF EXISTS "email_config_uuid_uq" RENAME TO "providers_uuid_uq";

-- 2. Create providers table (if it doesn't exist — fallback for fresh installs)
CREATE TABLE IF NOT EXISTS "emailsender"."providers" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(50) NOT NULL,
  "api_key" text NOT NULL,
  "api_endpoint" text,
  "from_email" text,
  "from_name" text,
  "reply_to" text,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "providers_uuid_uq" ON "emailsender"."providers" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "providers_provider_uq" ON "emailsender"."providers" ("provider");

-- 3. Generic config dictionary table (empty — no seed data).
-- Table name is "config" (schema "emailsender" provides isolation).
-- Future microservices follow the same pattern: <schema>.config
CREATE TABLE IF NOT EXISTS "emailsender"."config" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(50) NOT NULL,
  "value" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  "deleted_at" timestamptz,
  "deleted_by" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_uuid_uq" ON "emailsender"."config" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_key_uq" ON "emailsender"."config" ("key");
CREATE INDEX IF NOT EXISTS "config_deleted_at_idx" ON "emailsender"."config" ("deleted_at");

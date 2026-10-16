-- Primebrick webhook: initial schema (alpha)
-- Creates the webhook schema + config_entries table. Run once on a fresh database.

CREATE SCHEMA IF NOT EXISTS "webhook";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- config_entries (generic key/value dictionary for webhook — Config Table standard)
CREATE TABLE IF NOT EXISTS "webhook"."config_entries" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text,
  "type" varchar(50) NOT NULL DEFAULT 'string',
  "type_config" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "reserved" boolean NOT NULL DEFAULT false,
  "group_key" varchar(100),
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  "deleted_at" timestamptz,
  "deleted_by" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_uuid_uq" ON "webhook"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "webhook"."config_entries" ("key");
CREATE INDEX IF NOT EXISTS "config_entries_deleted_at_idx" ON "webhook"."config_entries" ("deleted_at");

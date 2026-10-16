-- Primebrick AI microservice: initial schema.
-- Creates the ai.config_entries table for microservice configuration.
-- The AI chat tables (ai_conversations, ai_messages, docs_kb, auth_events)
-- live in the public schema (created by the BE's init_database.sql patch)
-- because they are shared with the BE for MCP entity registry access.

CREATE SCHEMA IF NOT EXISTS "ai";
GRANT ALL ON SCHEMA "ai" TO primebrick;
GRANT ALL ON SCHEMA "ai" TO public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- config_entries table (microservice configuration — Config Table standard)
CREATE TABLE IF NOT EXISTS "ai"."config_entries" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "ai_config_entries_uuid_uq" ON "ai"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_config_entries_key_uq" ON "ai"."config_entries" ("key");
CREATE INDEX IF NOT EXISTS "ai_config_entries_deleted_at_idx" ON "ai"."config_entries" ("deleted_at");

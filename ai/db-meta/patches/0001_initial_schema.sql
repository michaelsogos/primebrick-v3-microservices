-- Primebrick AI microservice: initial schema.
-- Creates the ai.config table for microservice configuration.
-- The AI chat tables (ai_conversations, ai_messages, docs_kb, auth_events)
-- live in the public schema (created by the BE's init_database.sql patch)
-- because they are shared with the BE for MCP entity registry access.

CREATE SCHEMA IF NOT EXISTS "ai";
GRANT ALL ON SCHEMA "ai" TO primebrick;
GRANT ALL ON SCHEMA "ai" TO public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- config table (microservice configuration — same pattern as emailsender)
CREATE TABLE IF NOT EXISTS "ai"."config" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "ai_config_uuid_uq" ON "ai"."config" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_config_key_uq" ON "ai"."config" ("key");
CREATE INDEX IF NOT EXISTS "ai_config_deleted_at_idx" ON "ai"."config" ("deleted_at");

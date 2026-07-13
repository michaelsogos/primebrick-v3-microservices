-- Primebrick emailsender: initial schema (alpha)
-- Creates all emailsender tables in one script. Run once on a fresh database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. providers (email provider credentials)
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

-- 2. email_templates (MJML/HTML email templates)
CREATE TABLE IF NOT EXISTS "emailsender"."email_templates" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(100) NOT NULL,
  "language_iso" varchar(10) NOT NULL,
  "subject" text,
  "body_html" text,
  "body_text" text,
  "mjml_source" text,
  "variables" jsonb,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_uuid_uq" ON "emailsender"."email_templates" ("uuid");

-- 3. sender_log (email send audit trail)
CREATE TABLE IF NOT EXISTS "emailsender"."sender_log" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint,
  "entity_uuid" text,
  "type" text NOT NULL,
  "provider_message_id" text,
  "provider_uuid" uuid NOT NULL,
  "status" varchar(50) NOT NULL,
  "template_uuid" text,
  "senders" jsonb NOT NULL,
  "recipients" jsonb NOT NULL,
  "interpolated_sent_message" text,
  "error_message" text,
  "sent_at" timestamptz,
  "status_changed_at" timestamptz,
  PRIMARY KEY ("id")
);

-- 4. config (generic key/value dictionary for emailsender)
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

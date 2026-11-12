-- Primebrick: entity → database patch
-- generatedAt: 2026-11-11T16:25:25.337Z

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS "emailsender";

CREATE TABLE IF NOT EXISTS "emailsender"."providers" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(50) NOT NULL,
  "api_key" text NOT NULL,
  "api_endpoint" text,
  "from_email" text,
  "from_name" text,
  "reply_to" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "providers_uuid_uq" ON "emailsender"."providers" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "providers_provider_uq" ON "emailsender"."providers" ("provider");

CREATE SCHEMA IF NOT EXISTS "emailsender";

CREATE TABLE IF NOT EXISTS "emailsender"."email_templates" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(100) NOT NULL,
  "language_iso" varchar(10) NOT NULL,
  "subject" text,
  "body_html" text,
  "body_text" text,
  "mjml_source" text,
  "variables" jsonb,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_templates_uuid_uq" ON "emailsender"."email_templates" ("uuid");

CREATE SCHEMA IF NOT EXISTS "emailsender";

CREATE TABLE IF NOT EXISTS "emailsender"."sender_log" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" int8,
  "entity_uuid" uuid,
  "type" text NOT NULL,
  "provider_message_id" text,
  "provider_uuid" uuid NOT NULL,
  "status" varchar(50) NOT NULL,
  "template_uuid" uuid,
  "senders" jsonb NOT NULL,
  "recipients" jsonb NOT NULL,
  "interpolated_sent_message" text,
  "error_message" text,
  "sent_at" timestamptz,
  "status_changed_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sender_log_provider_message_id_uq" ON "emailsender"."sender_log" ("provider_message_id");

CREATE SCHEMA IF NOT EXISTS "emailsender";

CREATE TABLE IF NOT EXISTS "emailsender"."config_entries" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_uuid_uq" ON "emailsender"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "emailsender"."config_entries" ("key");

-- ---------------------------------------------------------------------------
-- Handwritten supplement — objects the entity contract cannot express.
--
-- emailsender.translations: per-service i18n store (BE/gateway-managed, not an
-- entity table). Same shape as crm/be/job/ai service schemas.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "emailsender"."translations" (
    "id" bigint NOT NULL,
    "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
    "key" varchar(255) NOT NULL,
    "language" varchar(10) NOT NULL,
    "value" text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "created_by" varchar(255) NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "updated_by" varchar(255) NOT NULL,
    "version" int4 DEFAULT 1 NOT NULL,
    "deleted_at" timestamptz,
    "deleted_by" varchar(255),
    CONSTRAINT "translations_key_shape" CHECK ((("key")::text ~ '^emailsender(\.[a-z0-9_]+)+$'::text))
);
CREATE SEQUENCE IF NOT EXISTS "emailsender"."translations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "emailsender"."translations_id_seq" OWNED BY "emailsender"."translations"."id";
ALTER TABLE ONLY "emailsender"."translations" ALTER COLUMN "id" SET DEFAULT nextval('"emailsender"."translations_id_seq"'::regclass);
ALTER TABLE ONLY "emailsender"."translations"
    ADD CONSTRAINT "translations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "emailsender"."translations"
    ADD CONSTRAINT "translations_uuid_uq" UNIQUE ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "emailsender_translations_key_language_uidx" ON "emailsender"."translations" USING btree ("key", "language") WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS "emailsender_translations_language_idx" ON "emailsender"."translations" USING btree ("language") WHERE (deleted_at IS NULL);

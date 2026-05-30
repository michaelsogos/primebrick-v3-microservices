-- Primebrick: entity → database patch (review before apply)
-- generatedAt: 2026-05-28T11:47:50.395Z

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "emailsender"."email_config" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "email_config_uuid_uq" ON "emailsender"."email_config" ("uuid");

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


-- === database patch registry (repeatable runs) ===
-- Create once on TARGET: see backend/src/db/database-patch-registry.ts (PATCH_REGISTRY_DDL).
-- patch_id: 20260528114750_create_emailsender_email_config_emailsender_email_templates
-- content_sha256: 59c1d0a958c4c8c2e5468ee9c4d625eff8b96bbc22779e0a2b90663b9c943a33
-- After apply:
-- INSERT INTO public.primebrick_database_patch (patch_id, content_sha256)
-- VALUES ('20260528114750_create_emailsender_email_config_emailsender_email_templates', '59c1d0a958c4c8c2e5468ee9c4d625eff8b96bbc22779e0a2b90663b9c943a33')
-- ON CONFLICT (patch_id) DO NOTHING;

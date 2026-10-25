-- Primebrick: entity → database patch
-- generatedAt: 2026-10-24T23:59:35.577Z

ALTER TABLE "emailsender"."email_templates" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;
ALTER TABLE "emailsender"."email_templates" ADD COLUMN IF NOT EXISTS "deleted_by" text;

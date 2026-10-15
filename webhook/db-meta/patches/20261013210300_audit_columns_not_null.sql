-- Primebrick: entity → database patch
-- generatedAt: 2026-10-13T21:34:54.301Z
-- fixes original sin: audit columns must be NOT NULL
SET search_path TO "webhook", public;

-- webhook.config_entries
UPDATE "webhook"."config_entries" SET "created_at" = COALESCE("created_at", "updated_at", now()) WHERE "created_at" IS NULL;
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "created_at" SET NOT NULL;
UPDATE "webhook"."config_entries" SET "created_by" = COALESCE("created_by", 'system') WHERE "created_by" IS NULL;
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "created_by" SET NOT NULL;
UPDATE "webhook"."config_entries" SET "updated_at" = COALESCE("updated_at", "created_at", now()) WHERE "updated_at" IS NULL;
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "webhook"."config_entries" SET "updated_by" = COALESCE("updated_by", 'system') WHERE "updated_by" IS NULL;
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "updated_by" SET NOT NULL;
UPDATE "webhook"."config_entries" SET "version" = COALESCE("version", 1) WHERE "version" IS NULL;
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "version" SET NOT NULL;

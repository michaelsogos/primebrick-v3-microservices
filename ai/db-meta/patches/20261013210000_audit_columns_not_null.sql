-- Primebrick: entity → database patch
-- generatedAt: 2026-10-13T21:34:54.298Z
-- fixes original sin: audit columns must be NOT NULL
SET search_path TO "ai", public;

-- ai.ai_cerebellum
UPDATE "ai"."ai_cerebellum" SET "created_at" = COALESCE("created_at", "updated_at", now()) WHERE "created_at" IS NULL;
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "created_at" SET NOT NULL;
UPDATE "ai"."ai_cerebellum" SET "created_by" = COALESCE("created_by", 'system') WHERE "created_by" IS NULL;
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "created_by" SET NOT NULL;
UPDATE "ai"."ai_cerebellum" SET "updated_at" = COALESCE("updated_at", "created_at", now()) WHERE "updated_at" IS NULL;
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "ai"."ai_cerebellum" SET "updated_by" = COALESCE("updated_by", 'system') WHERE "updated_by" IS NULL;
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "updated_by" SET NOT NULL;
UPDATE "ai"."ai_cerebellum" SET "version" = COALESCE("version", 1) WHERE "version" IS NULL;
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "version" SET NOT NULL;

-- ai.ai_models
UPDATE "ai"."ai_models" SET "created_at" = COALESCE("created_at", "updated_at", now()) WHERE "created_at" IS NULL;
ALTER TABLE "ai"."ai_models" ALTER COLUMN "created_at" SET NOT NULL;
UPDATE "ai"."ai_models" SET "created_by" = COALESCE("created_by", 'system') WHERE "created_by" IS NULL;
ALTER TABLE "ai"."ai_models" ALTER COLUMN "created_by" SET NOT NULL;
UPDATE "ai"."ai_models" SET "updated_at" = COALESCE("updated_at", "created_at", now()) WHERE "updated_at" IS NULL;
ALTER TABLE "ai"."ai_models" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "ai"."ai_models" SET "updated_by" = COALESCE("updated_by", 'system') WHERE "updated_by" IS NULL;
ALTER TABLE "ai"."ai_models" ALTER COLUMN "updated_by" SET NOT NULL;
UPDATE "ai"."ai_models" SET "version" = COALESCE("version", 1) WHERE "version" IS NULL;
ALTER TABLE "ai"."ai_models" ALTER COLUMN "version" SET NOT NULL;

-- ai.config_entries
UPDATE "ai"."config_entries" SET "created_at" = COALESCE("created_at", "updated_at", now()) WHERE "created_at" IS NULL;
ALTER TABLE "ai"."config_entries" ALTER COLUMN "created_at" SET NOT NULL;
UPDATE "ai"."config_entries" SET "created_by" = COALESCE("created_by", 'system') WHERE "created_by" IS NULL;
ALTER TABLE "ai"."config_entries" ALTER COLUMN "created_by" SET NOT NULL;
UPDATE "ai"."config_entries" SET "updated_at" = COALESCE("updated_at", "created_at", now()) WHERE "updated_at" IS NULL;
ALTER TABLE "ai"."config_entries" ALTER COLUMN "updated_at" SET NOT NULL;
UPDATE "ai"."config_entries" SET "updated_by" = COALESCE("updated_by", 'system') WHERE "updated_by" IS NULL;
ALTER TABLE "ai"."config_entries" ALTER COLUMN "updated_by" SET NOT NULL;
UPDATE "ai"."config_entries" SET "version" = COALESCE("version", 1) WHERE "version" IS NULL;
ALTER TABLE "ai"."config_entries" ALTER COLUMN "version" SET NOT NULL;

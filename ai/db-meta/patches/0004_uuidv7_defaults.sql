-- Primebrick: ai phase-1 — uuidv7 column defaults
-- Generated section: docs_kb.uuid + docs_ingest_log.uuid (entity-declared @Unique @Column uuid)

ALTER TABLE "ai"."docs_kb"         ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT uuidv7() NOT NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT uuidv7() NOT NULL;
-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "docs_kb_uuid_uq" ON "ai"."docs_kb" ("uuid");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "docs_ingest_log_uuid_uq" ON "ai"."docs_ingest_log" ("uuid");
-- pb:end-no-transaction

-- Handwritten section: swap generation default gen_random_uuid() -> uuidv7()
-- on pre-existing uuid columns (default expressions are a differ blind spot).
-- ai_conversations: partitioned — parent ALTER covers all partitions.

ALTER TABLE "ai"."ai_cerebellum"   ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."ai_conversations" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."ai_feedback"     ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."ai_messages"     ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."ai_models"       ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."ai_telemetry"    ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."config_entries"  ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "ai"."translations"    ALTER COLUMN "uuid" SET DEFAULT uuidv7();

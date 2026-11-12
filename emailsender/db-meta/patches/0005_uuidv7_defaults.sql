-- Primebrick: emailsender phase-1 — uuidv7 column defaults
-- Generated section: sender_log.uuid (entity-declared @Unique @Column uuid)

ALTER TABLE "emailsender"."sender_log" ADD COLUMN IF NOT EXISTS "uuid" uuid DEFAULT uuidv7() NOT NULL;
-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "sender_log_uuid_uq" ON "emailsender"."sender_log" ("uuid");
-- pb:end-no-transaction

-- Handwritten section: swap generation default gen_random_uuid() -> uuidv7()
-- on pre-existing uuid columns (default expressions are a differ blind spot).

ALTER TABLE "emailsender"."providers"       ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "emailsender"."email_templates" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "emailsender"."config_entries"  ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "emailsender"."translations"    ALTER COLUMN "uuid" SET DEFAULT uuidv7();

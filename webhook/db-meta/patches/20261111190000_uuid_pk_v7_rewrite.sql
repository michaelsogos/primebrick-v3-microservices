-- Primebrick: webhook uuid migration — PK swap id→uuid + v4→v7 rewrite.
-- This module was skipped by phases 1/4+5 entirely: config_entries still had
-- a bigint id PK and a gen_random_uuid() (v4) uuid column. Nothing references
-- config_entries.uuid (the service reads by `key`, no audit table) → no map,
-- no ref rewrite: drop the bigint id, promote uuid to PK, swap the default
-- to uuidv7(), rewrite the 8 existing v4 values.
-- translations keeps its bigint id PK (non-entity store — established
-- decision) but its uuid column must still be v7.

ALTER TABLE "webhook"."config_entries" DROP COLUMN "id";
ALTER TABLE "webhook"."config_entries" ADD PRIMARY KEY ("uuid");
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "webhook"."translations" ALTER COLUMN "uuid" SET DEFAULT uuidv7();

UPDATE "webhook"."config_entries" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;
UPDATE "webhook"."translations" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "webhook"."config_entries" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "webhook"."translations" WHERE uuid_extract_version("uuid") <> 7) THEN
    RAISE EXCEPTION 'webhook uuid migration gate: non-v7 uuid remains';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='webhook' AND table_name='config_entries' AND column_name='id') THEN
    RAISE EXCEPTION 'webhook uuid migration gate: config_entries.id still exists';
  END IF;
END $$;

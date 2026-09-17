-- Fire-and-forget: rename emailsender.config → emailsender.config_entries,
-- add the missing Config Table standard columns (type, type_config, reserved,
-- group_key), widen "key" to varchar(100), and rename indexes.
-- Run ONCE on existing databases. Idempotent (IF EXISTS / IF NOT EXISTS).

BEGIN;

-- 1. Rename table
ALTER TABLE IF EXISTS "emailsender"."config" RENAME TO "config_entries";

-- 2. Standard Config Table columns (idempotent)
ALTER TABLE "emailsender"."config_entries"
  ALTER COLUMN "key" TYPE varchar(100);
ALTER TABLE "emailsender"."config_entries"
  ADD COLUMN IF NOT EXISTS "type" varchar(50) NOT NULL DEFAULT 'string',
  ADD COLUMN IF NOT EXISTS "type_config" text,
  ADD COLUMN IF NOT EXISTS "reserved" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "group_key" varchar(100);

-- 3. Rename indexes
ALTER INDEX IF EXISTS "emailsender"."config_uuid_uq" RENAME TO "config_entries_uuid_uq";
ALTER INDEX IF EXISTS "emailsender"."config_key_uq" RENAME TO "config_entries_key_uq";
ALTER INDEX IF EXISTS "emailsender"."config_deleted_at_idx" RENAME TO "config_entries_deleted_at_idx";

-- 4. Update patch registry hashes for the modified patches.
UPDATE "public"."primebrick_database_patches"
SET content_sha256 = '7da095e73a1d6ae8cf12c50f7e878bed87d3dc9b31284b4d11d3a6c016d54b46'
WHERE patch_id = '0001_initial_schema'
  AND content_sha256 = '8aa35ea1bfa182390f530b3b3f072dce59592354fe7044b2fcaaf64207307be4';
UPDATE "public"."primebrick_database_patches"
SET content_sha256 = '9c6904e69b73480c92c829db0b39e8379caac095dbafdbd88a96b870446505d4'
WHERE patch_id = '0002_seed_microservice_config'
  AND content_sha256 = 'dbd93940444932385150050783ca8ccab7d72098bb0233137cb3f94ef7e37356';

COMMIT;

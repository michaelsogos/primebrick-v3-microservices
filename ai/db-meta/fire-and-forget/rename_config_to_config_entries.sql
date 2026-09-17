-- Fire-and-forget: rename ai.config → ai.config_entries,
-- add the missing Config Table standard columns (type, type_config, reserved,
-- group_key), widen "key" to varchar(100), and rename indexes.
-- Run ONCE on existing databases. Idempotent (IF EXISTS / IF NOT EXISTS).

BEGIN;

-- 1. Rename table
ALTER TABLE IF EXISTS "ai"."config" RENAME TO "config_entries";

-- 2. Standard Config Table columns (idempotent)
ALTER TABLE "ai"."config_entries"
  ALTER COLUMN "key" TYPE varchar(100);
ALTER TABLE "ai"."config_entries"
  ADD COLUMN IF NOT EXISTS "type" varchar(50) NOT NULL DEFAULT 'string',
  ADD COLUMN IF NOT EXISTS "type_config" text,
  ADD COLUMN IF NOT EXISTS "reserved" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "group_key" varchar(100);

-- 3. Rename indexes
ALTER INDEX IF EXISTS "ai"."ai_config_uuid_uq" RENAME TO "ai_config_entries_uuid_uq";
ALTER INDEX IF EXISTS "ai"."ai_config_key_uq" RENAME TO "ai_config_entries_key_uq";
ALTER INDEX IF EXISTS "ai"."ai_config_deleted_at_idx" RENAME TO "ai_config_entries_deleted_at_idx";

-- 4. Update patch registry hashes for the modified patches.
UPDATE "public"."primebrick_database_patches"
SET content_sha256 = 'daf43b893c8ca11b6c8246afd6bc830d138709d6347c89328d9e87456c7543ae'
WHERE patch_id = '0001_initial_schema'
  AND content_sha256 = '1b8ba09d752f93f379ab2647be36f0f506c8e5aa5304b07de63d3fad134077db';
UPDATE "public"."primebrick_database_patches"
SET content_sha256 = '06d2796b1431c82bde0424b17226a47b6b72c160306d5ace61bd089fbecb1a33'
WHERE patch_id = '0002_seed_microservice_config'
  AND content_sha256 = '460bd8599d3f84fddd499e98bf0dbab9b366c4fe40c7b6b295b506b85e9a2eea';

COMMIT;

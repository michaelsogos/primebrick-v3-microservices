-- Fire-and-forget: align emailsender.sender_log column types with
-- 0001_initial_schema.sql and update the registry hash.
--
-- WHY: sender_log.entity_id / entity_uuid / template_uuid held internal
-- references (request.entityId, request.entityUuid, template.uuid) typed as
-- text. They are real bigint/uuid values produced by our own system, so the
-- initial patch was updated in place (entity_uuid -> uuid, template_uuid ->
-- uuid; entity_id was already bigint in the patch but text on live DBs).
--
-- Old sha256: daf43b893c8ca11b6c8246afd6bc830d138709d6347c89328d9e87456c7543ae
-- New sha256: 688746cf5b37619e3541bf3b057768cb508b52d3a603a6a0ad9a3ac9a9399704
-- Date: 2026-09-28

BEGIN;

-- Align live column types (idempotent — USING casts are no-ops once converted).
ALTER TABLE emailsender.sender_log
  ALTER COLUMN "entity_id" TYPE bigint USING NULLIF("entity_id", '')::bigint,
  ALTER COLUMN "entity_uuid" TYPE uuid USING NULLIF("entity_uuid", '')::uuid,
  ALTER COLUMN "template_uuid" TYPE uuid USING NULLIF("template_uuid", '')::uuid;

UPDATE public.primebrick_database_patches
SET content_sha256 = '688746cf5b37619e3541bf3b057768cb508b52d3a603a6a0ad9a3ac9a9399704'
WHERE patch_id = '0001_initial_schema'
  AND content_sha256 <> '688746cf5b37619e3541bf3b057768cb508b52d3a603a6a0ad9a3ac9a9399704';

COMMIT;

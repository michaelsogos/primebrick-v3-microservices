-- Fire-and-forget: update content_sha256 for patch 0002_seed_microservice_config.
--
-- WHY: the patch was edited 2026-10-10 — service_code normalized to lowercase
-- ('AI' -> 'ai', single snake_case format matching serviceName) and the new
-- 'service_base_url' config key was added (env-policy: SERVICE_BASE_URL env removed).
-- Old sha256: 06d2796b1431... (registry)
-- New sha256: 3a921056a58eca194c4c81c26dcc7c3e98534867508b0993a55be1a90a70f655

BEGIN;
UPDATE public.primebrick_database_patches
SET content_sha256 = '3a921056a58eca194c4c81c26dcc7c3e98534867508b0993a55be1a90a70f655'
WHERE patch_id = '0002_seed_microservice_config'
  AND content_sha256 <> '3a921056a58eca194c4c81c26dcc7c3e98534867508b0993a55be1a90a70f655';
COMMIT;

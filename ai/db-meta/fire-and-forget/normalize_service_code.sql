-- Fire-and-forget: normalize service_code to lowercase snake_case ('AI' -> 'ai')
-- and add the service_base_url config key on existing databases (2026-10-10).
-- Idempotent — safe to run multiple times.

UPDATE "ai"."config_entries"
SET value = 'ai', updated_by = 'system'
WHERE "key" = 'service_code' AND value <> 'ai';

INSERT INTO "ai"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES ('service_base_url', 'http://localhost:3004', 'config.service_base_url.label', 'config.service_base_url.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

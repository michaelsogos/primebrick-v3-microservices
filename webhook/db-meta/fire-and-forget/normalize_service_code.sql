-- Fire-and-forget: normalize service_code to lowercase snake_case ('WEBHOOK' -> 'webhook')
-- and add the service_base_url config key on existing databases (2026-10-10).
-- Idempotent — safe to run multiple times.

UPDATE "webhook"."config_entries"
SET value = 'webhook', updated_by = 'system'
WHERE "key" = 'service_code' AND value <> 'webhook';

INSERT INTO "webhook"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES ('service_base_url', 'http://localhost:3005', 'config.service_base_url.label', 'config.service_base_url.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

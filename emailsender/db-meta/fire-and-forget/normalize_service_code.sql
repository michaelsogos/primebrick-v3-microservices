-- Fire-and-forget: normalize service_code to lowercase snake_case ('EMAILSENDER' -> 'emailsender')
-- and seed the config rows that never reached existing databases — the service's
-- 0002 seed patch collided in the shared patch registry with ai's same-named patch
-- and was never applied (renamed to 0002_seed_emailsender_config.sql, 2026-10-10).
-- Idempotent — safe to run multiple times.

INSERT INTO "emailsender"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'config.nats_url.label', 'config.nats_url.description', 'system', 'system'),
  ('service_code', 'emailsender', 'config.service_code.label', 'config.service_code.description', 'system', 'system'),
  ('http_port', '3003', 'config.http_port.label', 'config.http_port.description', 'system', 'system'),
  ('service_base_url', 'http://localhost:3003', 'config.service_base_url.label', 'config.service_base_url.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

UPDATE "emailsender"."config_entries"
SET value = 'emailsender', updated_by = 'system'
WHERE "key" = 'service_code' AND value <> 'emailsender';

INSERT INTO "emailsender"."providers" ("provider", "api_key", "api_endpoint", "created_by", "updated_by")
VALUES ('brevo', 'CHANGE_ME_ADMIN_MUST_SET_VIA_FE', 'https://api.brevo.com/v1', 'system', 'system')
ON CONFLICT ("provider") DO NOTHING;

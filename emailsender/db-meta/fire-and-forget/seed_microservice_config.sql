-- Fire-and-forget: seed microservice config keys for existing databases.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- Run this after applying the 0002 patch or on an existing DB that lacks these keys.

-- Seed config keys with local dev defaults.
-- In Docker, UPDATE nats_url after running this script:
--   UPDATE emailsender.config SET value = 'nats://primebrick-nats:4222' WHERE key = 'nats_url';
-- Note: service_base_url is NOT in config table — it stays as ENV var
-- (dynamic host port set by deploy script).
-- Note: brevo_api_key and brevo_api_endpoint are NOT in config table — they
-- come from the emailsender.providers table, set up by admin users via the FE.

INSERT INTO "emailsender"."config" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'config.nats_url.label', 'config.nats_url.description', 'system', 'system'),
  ('service_code', 'EMAILSENDER', 'config.service_code.label', 'config.service_code.description', 'system', 'system'),
  ('http_port', '3003', 'config.http_port.label', 'config.http_port.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

-- Seed a default Brevo provider record with a placeholder API key.
-- The admin user MUST update this via the FE (PUT /api/v1/providers/:uuid)
-- with the real Brevo API key before the microservice can send emails.
INSERT INTO "emailsender"."providers" ("provider", "api_key", "api_endpoint", "created_by", "updated_by")
VALUES
  ('brevo', 'CHANGE_ME_ADMIN_MUST_SET_VIA_FE', 'https://api.brevo.com/v1', 'system', 'system')
ON CONFLICT ("provider") DO NOTHING;

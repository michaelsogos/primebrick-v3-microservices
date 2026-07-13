-- Seed microservice config keys into emailsender.config table.
-- These replace ENV vars that were previously passed to the container.
-- Only DATABASE_URL, DB_SCHEMA, and SERVICE_BASE_URL remain as ENV vars.
-- SERVICE_BASE_URL stays as ENV because the host port is dynamic (set by
-- deploy script at deploy time) and can't be known when seeding the config table.
-- BREVO_API_KEY and BREVO_API_ENDPOINT are NOT in the config table — they
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

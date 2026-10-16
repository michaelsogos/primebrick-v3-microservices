-- Seed microservice config keys into webhook.config_entries table.
-- These replace ENV vars that were previously passed to the container.
-- Only DATABASE_URL remains as an ENV var (env-policy: everything else is config).
--
-- service_client_shield_key is generated per environment (never committed, never shared):
-- only its sha256 hash travels to system.client_registry via service.register.

INSERT INTO "webhook"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'config.nats_url.label', 'config.nats_url.description', 'system', 'system'),
  ('service_code', 'webhook', 'config.service_code.label', 'config.service_code.description', 'system', 'system'),
  ('http_port', '3005', 'config.http_port.label', 'config.http_port.description', 'system', 'system'),
  ('service_base_url', 'http://localhost:3005', 'config.service_base_url.label', 'config.service_base_url.description', 'system', 'system'),
  ('service_client_shield_key', encode(gen_random_bytes(32), 'hex'), 'config.service_client_shield_key.label', 'config.service_client_shield_key.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

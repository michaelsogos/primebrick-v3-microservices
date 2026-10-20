-- 0002 — seed crm.config_entries: the mandatory microservice config rows.
-- Mirrors the sibling services (nats_url, service_code, http_port, …).
-- service_code must equal the package-derived code (primebrick-crm → crm);
-- the seed row is a drift tripwire — boot fails if it diverges.
-- service_client_shield_key is generated per environment (never committed,
-- never shared); the shield secret placeholder is rotated by the engine.

BEGIN;

INSERT INTO "crm"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'config.nats_url.label', 'config.nats_url.description', 'system', 'system'),
  ('service_code', 'crm', 'config.service_code.label', 'config.service_code.description', 'system', 'system'),
  ('http_port', '3007', 'config.http_port.label', 'config.http_port.description', 'system', 'system'),
  ('service_base_url', 'http://localhost:3007', 'config.service_base_url.label', 'config.service_base_url.description', 'system', 'system'),
  ('be_base_url', 'http://localhost:3001', 'config.be_base_url.label', 'config.be_base_url.description', 'system', 'system'),
  ('auth_mode', 'GATEWAY', 'config.auth_mode.label', 'config.auth_mode.description', 'system', 'system'),
  ('auth_roles_path', 'roles', 'config.auth_roles_path.label', 'config.auth_roles_path.description', 'system', 'system'),
  ('service_client_shield_key', encode(gen_random_bytes(32), 'hex'), 'config.service_client_shield_key.label', 'config.service_client_shield_key.description', 'system', 'system'),
  ('service_client_shield_secret', '__ROTATED_BY_SECRET_ENGINE__', 'config.service_client_shield_secret.label', 'config.service_client_shield_secret.description', 'system', 'system'),
  ('service_client_shield_secret_header', 'x-client-shield-secret', 'config.service_client_shield_secret_header.label', 'config.service_client_shield_secret_header.description', 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

COMMIT;

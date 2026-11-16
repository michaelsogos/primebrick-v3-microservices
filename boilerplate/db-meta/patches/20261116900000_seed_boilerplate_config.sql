-- Seed microservice config keys into boilerplate.config_entries.
-- These replace ENV vars (env-policy: only DATABASE_URL + DATABASE_SCHEMA
-- come from .env). Runs AFTER the entity-generated patch that creates
-- config_entries — timestamp ordering is the contract.
--
-- service_client_shield_key is generated per environment (never committed,
-- never shared): only its sha256 hash travels to system.client_registry
-- via service.register.

INSERT INTO "boilerplate"."config_entries" ("key", "value", "type", "label_key", "description_key", "reserved", "created_by", "updated_by")
VALUES
  ('nats_url', 'nats://127.0.0.1:4222', 'string', 'system.settings.config.infra.nats_url.label', 'system.settings.config.infra.nats_url.description', false, 'system', 'system'),
  ('service_code', 'boilerplate', 'string', 'system.settings.config.infra.service_code.label', 'system.settings.config.infra.service_code.description', false, 'system', 'system'),
  ('http_port', '3008', 'string', 'system.settings.config.infra.http_port.label', 'system.settings.config.infra.http_port.description', false, 'system', 'system'),
  ('service_base_url', 'http://localhost:3008', 'string', 'system.settings.config.infra.service_base_url.label', 'system.settings.config.infra.service_base_url.description', false, 'system', 'system'),
  ('be_base_url', 'http://localhost:3001', 'string', 'system.settings.config.infra.be_base_url.label', 'system.settings.config.infra.be_base_url.description', false, 'system', 'system'),
  ('service_client_shield_key', encode(gen_random_bytes(32), 'hex'), 'string', 'system.settings.config.auth.service_client_shield_key.label', 'system.settings.config.auth.service_client_shield_key.description', false, 'system', 'system'),
  ('service_client_shield_secret', '__ROTATED_BY_SECRET_ENGINE__', 'secret', 'system.settings.config.auth.service_client_shield_secret.label', 'system.settings.config.auth.service_client_shield_secret.description', true, 'system', 'system'),
  ('service_client_shield_secret_header', 'x-client-shield-secret', 'string', 'system.settings.config.auth.service_client_shield_secret_header.label', 'system.settings.config.auth.service_client_shield_secret_header.description', false, 'system', 'system')
ON CONFLICT ("key") DO NOTHING;

-- Primebrick: gateway public-secret config rows — declared, empty.
--
-- `gateway_public_secret` / `gateway_public_secret_header` are read by
-- JobAuthConfigPort (auth-ports-adapter) and REQUIRED in GATEWAY mode per
-- the platform auth contract. The rows existed nowhere: absent meant the
-- module-config tab could never render them (PUT edits rows, it cannot
-- create). Seeded EMPTY — the value is static admin-owned trust material
-- (no secret-engine rotation; only `service_client_shield_secret` rotates
-- via Redis). Labels follow the shared registry contract
-- `system.settings.config.auth.*` in system.translations.

INSERT INTO job.config_entries (uuid, key, value, type, type_config, label_key, description_key, reserved, group_key, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) VALUES
  (uuidv7(), 'gateway_public_secret', '', 'string', NULL, 'system.settings.config.auth.gateway_public_secret.label', 'system.settings.config.auth.gateway_public_secret.description', false, NULL, now(), 'migration-gateway-config', now(), 'migration-gateway-config', 1, NULL, NULL),
  (uuidv7(), 'gateway_public_secret_header', '', 'string', NULL, 'system.settings.config.auth.gateway_public_secret_header.label', 'system.settings.config.auth.gateway_public_secret_header.description', false, NULL, now(), 'migration-gateway-config', now(), 'migration-gateway-config', 1, NULL, NULL);

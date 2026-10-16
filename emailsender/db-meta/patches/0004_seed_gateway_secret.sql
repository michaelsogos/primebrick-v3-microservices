-- 0004 — Seed the BE↔US gateway shared secret.
--
-- Every microservice runs GATEWAY auth: the BE resolves the JWT, serializes
-- the AuthUser into x-user-* headers, and proves itself via this shared
-- secret (x-client-shield-secret header). Without these rows the US rejects every
-- proxied call with AUTH_GATEWAY_NOT_CONFIGURED (observed: entity routes).
--
-- NOTE: the value is a placeholder — the real secret is auto-generated and
-- rotated by the rotating-secret engine (Redis + secret.get/secret.rotated).
-- config_entries only holds legacy fallback; see sdk/secrets/rotating-secret.ts.
INSERT INTO "emailsender"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('service_client_shield_secret', '__ROTATED_BY_SECRET_ENGINE__', 'config.service_client_shield_secret.label', 'config.service_client_shield_secret.description', 'system', 'system'),
  ('service_client_shield_secret_header', 'x-client-shield-secret', 'config.service_client_shield_secret_header.label', 'config.service_client_shield_secret_header.description', 'system', 'system')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";

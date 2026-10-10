-- 0006 — Seed the BE↔US gateway shared secret.
--
-- Every microservice runs GATEWAY auth: the BE resolves the JWT, serializes
-- the AuthUser into x-user-* headers, and proves itself via this shared
-- secret (x-gateway-secret header). Without these rows the US rejects every
-- proxied call with AUTH_GATEWAY_NOT_CONFIGURED (observed: entity routes).
-- The same secret MUST exist in public.config_entries on the BE side.
INSERT INTO "ai"."config_entries" ("key", "value", "label_key", "description_key", "created_by", "updated_by")
VALUES
  ('gateway_secret', '22b88f888c93a282f34aae9539c9c1fa7c255a19a1dd0bce4f023b49a3a93bc2', 'config.gateway_secret.label', 'config.gateway_secret.description', 'system', 'system'),
  ('gateway_secret_header', 'x-gateway-secret', 'config.gateway_secret_header.label', 'config.gateway_secret_header.description', 'system', 'system')
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";

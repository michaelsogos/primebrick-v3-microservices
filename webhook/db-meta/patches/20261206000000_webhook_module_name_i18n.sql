-- Primebrick: webhook.module.name — seeds the module display-name key the
-- service now declares via `labelKey` at registration (webhook/index.ts).
-- Every UI surface resolves it against this namespace; the registry `name`
-- remains the fallback while the key is absent.

INSERT INTO webhook.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'webhook.module.name', 'en-GB', 'Webhook Ingress', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'en-US', 'Webhook Ingress', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'it-IT', 'Ingresso Webhook', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'fr-FR', 'Point d''entrée Webhook', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'es-ES', 'Entrada de Webhook', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'de-DE', 'Webhook-Eingang', now(), 'migration-module-label', now(), 'migration-module-label', 1),
  (uuidv7(), 'webhook.module.name', 'pt-PT', 'Entrada de Webhook', now(), 'migration-module-label', now(), 'migration-module-label', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

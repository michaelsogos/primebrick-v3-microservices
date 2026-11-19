-- Primebrick: `crm.events.fields.*` — labels for the domain extra blocks
-- carried by the semantic customer events (schema:2 payloads): the
-- `change` block on `on.changed`, `trigger`/`payout` on the semantic
-- facts, `account_manager` as the notification recipient. Shown by the
-- PropNavigator columns via `x_label_key` instead of raw prop names.

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.events.fields.change', 'en-GB', 'Change', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'en-US', 'Change', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'it-IT', 'Modifica', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'fr-FR', 'Modification', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'es-ES', 'Cambio', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'de-DE', 'Änderung', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.change', 'pt-PT', 'Alteração', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),

  (uuidv7(), 'crm.events.fields.trigger', 'en-GB', 'Trigger details', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'en-US', 'Trigger details', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'it-IT', 'Dettagli trigger', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'fr-FR', 'Détails du déclencheur', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'es-ES', 'Detalles del trigger', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'de-DE', 'Trigger-Details', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.trigger', 'pt-PT', 'Detalhes do trigger', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),

  (uuidv7(), 'crm.events.fields.payout', 'en-GB', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'en-US', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'it-IT', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'fr-FR', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'es-ES', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'de-DE', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.payout', 'pt-PT', 'Payout', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),

  (uuidv7(), 'crm.events.fields.account_manager', 'en-GB', 'Account manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'en-US', 'Account manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'it-IT', 'Account manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'fr-FR', 'Account manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'es-ES', 'Account manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'de-DE', 'Account-Manager', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1),
  (uuidv7(), 'crm.events.fields.account_manager', 'pt-PT', 'Gestor de conta', now(), 'migration-events-fields-i18n', now(), 'migration-events-fields-i18n', 1)
ON CONFLICT DO NOTHING;

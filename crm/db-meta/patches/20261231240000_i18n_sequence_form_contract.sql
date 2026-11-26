-- Sequence create-form contract i18n (bugfix-sequence-create-form-contract):
--
--   • `fields.revived_from` — the value is the PREDECESSOR generation's
--     uuid → clone-family copy ("Cloned From"). The previous "Rinnovato
--     da" collided with `revived_by`'s actor label (two fields rendered
--     identically). Delete + re-seed, same repair pattern as
--     20261113141900_clone_from_label_collision_fix.
--   • `fields.default_from` — became a create INPUT (the generation's
--     serve anchor) → "starts from" copy, not the display-only
--     "Default da".
--   • `fields.revive_slot_values.{sez,sez2,sez3}` — the badge option
--     labels for the closed revive_slot enum. "Sezionale" stays
--     untranslated — the same convention the pattern tokens use
--     (`tokens.sez` = "Sezionale slot 1" in every language).

DELETE FROM crm.translations
WHERE key IN (
  'crm.entities.sequence.fields.revived_from',
  'crm.entities.sequence.fields.default_from'
);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  -- ── revived_from → clone-family copy ──────────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'en-GB', 'Cloned From', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'en-US', 'Cloned From', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'it-IT', 'Clone Di', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'fr-FR', 'Cloné Depuis', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'es-ES', 'Clonado Desde', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'de-DE', 'Klon Von', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'pt-PT', 'Clonado De', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),

  -- ── default_from → create-input copy ──────────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'en-GB', 'Starts from', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'en-US', 'Starts from', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'it-IT', 'Valida dal', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'fr-FR', 'Active depuis', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'es-ES', 'Activa desde', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'de-DE', 'Aktiv ab', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'pt-PT', 'Ativa de', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),

  -- ── revive_slot badge option labels (untranslated domain term) ────
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'en-GB', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'en-US', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'it-IT', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'fr-FR', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'es-ES', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'de-DE', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez', 'pt-PT', 'Sezionale 1', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),

  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'en-GB', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'en-US', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'it-IT', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'fr-FR', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'es-ES', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'de-DE', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez2', 'pt-PT', 'Sezionale 2', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),

  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'en-GB', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'en-US', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'it-IT', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'fr-FR', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'es-ES', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'de-DE', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot_values.sez3', 'pt-PT', 'Sezionale 3', now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1);

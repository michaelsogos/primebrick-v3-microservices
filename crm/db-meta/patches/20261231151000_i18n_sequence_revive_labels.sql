-- Primebrick: sequence reviver — field labels for the new served
-- columns + the sequence-revive confirm copy + the callable
-- label/description JH surfaces for <svc>.sequence_revive.

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'en-GB', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'en-US', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'it-IT', 'Rinnovare questa sequenza ora? Verrà creata una nuova generazione e quella corrente verrà ritirata dopo la finestra di tolleranza.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'fr-FR', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'es-ES', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'de-DE', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_revive_confirm', 'pt-PT', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.callable.sequence_revive.label', 'en-GB', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'en-US', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'it-IT', 'Rinnovo sequenze', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'fr-FR', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'es-ES', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'de-DE', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.label', 'pt-PT', 'Sequence revive', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'en-GB', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'en-US', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'it-IT', 'Crea le generazioni successive per le sequenze scadute e ritira le righe oltre il momento di cambio.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'fr-FR', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'es-ES', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'de-DE', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.callable.sequence_revive.desc', 'pt-PT', 'Creates successor generations for expired sequences and retires rows past their switch time.', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'en-GB', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'en-US', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'it-IT', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'fr-FR', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'es-ES', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'de-DE', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez', 'pt-PT', 'Sezionale', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'en-GB', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'en-US', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'it-IT', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'fr-FR', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'es-ES', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'de-DE', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez2', 'pt-PT', 'Sezionale 2', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'en-GB', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'en-US', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'it-IT', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'fr-FR', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'es-ES', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'de-DE', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez3', 'pt-PT', 'Sezionale 3', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'en-GB', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'en-US', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'it-IT', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'fr-FR', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'es-ES', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'de-DE', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.binding_key', 'pt-PT', 'Binding', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'en-GB', 'Revive every', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'en-US', 'Revive every', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'it-IT', 'Rinnovo ogni', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'fr-FR', 'Renouveler tous les', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'es-ES', 'Renovar cada', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'de-DE', 'Erneuern alle', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'pt-PT', 'Renovar a cada', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'en-GB', 'Revive grace', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'en-US', 'Revive grace', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'it-IT', 'Tolleranza rinnovo', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'fr-FR', 'Tolérance renouvellement', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'es-ES', 'Tolerancia renovación', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'de-DE', 'Erneuerungs-Toleranz', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'pt-PT', 'Tolerância renovação', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'en-GB', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'en-US', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'it-IT', 'Slot rinnovo', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'fr-FR', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'es-ES', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'de-DE', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot', 'pt-PT', 'Revive slot', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'en-GB', 'Expires at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'en-US', 'Expires at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'it-IT', 'Scade il', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'fr-FR', 'Expire le', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'es-ES', 'Expira el', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'de-DE', 'Läuft ab am', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'pt-PT', 'Expira em', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'en-GB', 'Switches at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'en-US', 'Switches at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'it-IT', 'Cambia il', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'fr-FR', 'Bascule le', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'es-ES', 'Cambia el', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'de-DE', 'Wechselt am', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'pt-PT', 'Muda em', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'en-GB', 'Default from', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'en-US', 'Default from', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'it-IT', 'Default da', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'fr-FR', 'Par défaut depuis', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'es-ES', 'Por defecto desde', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'de-DE', 'Standard ab', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from', 'pt-PT', 'Padrão desde', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'en-GB', 'Revived from', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'en-US', 'Revived from', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'it-IT', 'Rinnovato da', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'fr-FR', 'Renouvelé depuis', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'es-ES', 'Renovado desde', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'de-DE', 'Erneuert von', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_from', 'pt-PT', 'Renovado desde', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'en-GB', 'Revived at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'en-US', 'Revived at', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'it-IT', 'Rinnovato il', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'fr-FR', 'Renouvelé le', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'es-ES', 'Renovado el', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'de-DE', 'Erneuert am', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_at', 'pt-PT', 'Renovado em', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'en-GB', 'Revived by', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'en-US', 'Revived by', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'it-IT', 'Rinnovato da', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'fr-FR', 'Renouvelé par', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'es-ES', 'Renovado por', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'de-DE', 'Erneuert von', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revived_by', 'pt-PT', 'Renovado por', now(), 'migration-sequence-revive-i18n', now(), 'migration-sequence-revive-i18n', 1);


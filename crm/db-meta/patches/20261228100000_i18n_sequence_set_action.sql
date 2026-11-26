-- Primebrick: builtin `sequence` entity — `sequence_set` row custom action i18n
-- (the governed `POST /api/v1/actions/sequence-set` op: counter re-seed with
-- pre-dispatch confirm + MFA step-up). CTA label key derives from the
-- entity_op convention `<entities_ns>.actions.<op>`; the confirm dialog key is
-- declared on the route's `cta.confirm_key`. 7 languages, same vocabulary as
-- the builtin sequence surface patch.

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.actions.sequence_set', 'en-GB', 'Set counter', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'en-US', 'Set counter', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'it-IT', 'Imposta contatore', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'fr-FR', 'Définir le compteur', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'es-ES', 'Definir contador', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'de-DE', 'Zähler setzen', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set', 'pt-PT', 'Definir contador', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'en-GB', 'Set the next value this sequence will generate? Values already assigned are not affected.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'en-US', 'Set the next value this sequence will generate? Values already assigned are not affected.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'it-IT', 'Impostare il prossimo valore che questa sequenza genererà? I valori già assegnati non vengono modificati.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'fr-FR', 'Définir la prochaine valeur que cette séquence générera ? Les valeurs déjà attribuées ne sont pas modifiées.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'es-ES', '¿Definir el próximo valor que generará esta secuencia? Los valores ya asignados no se modifican.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'de-DE', 'Den nächsten Wert festlegen, den diese Sequenz erzeugt? Bereits vergebene Werte bleiben unverändert.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1),
  (uuidv7(), 'crm.actions.sequence_set_confirm', 'pt-PT', 'Definir o próximo valor que esta sequência vai gerar? Os valores já atribuídos não são alterados.', now(), 'migration-sequence-set-i18n', now(), 'migration-sequence-set-i18n', 1);

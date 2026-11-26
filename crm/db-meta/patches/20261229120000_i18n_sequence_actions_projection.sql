-- Primebrick: builtin `sequence` entity — disable/enable action chrome +
-- counter-projection column labels. The action keys back the
-- `actions_overrides` in sequence-decl (soft-delete reads as "disable",
-- same semantics as job_trigger); the field keys back the virtual counter
-- columns attached by attachCounterProjection.

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'en-GB', 'Disable', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'en-US', 'Disable', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'it-IT', 'Disabilita', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'fr-FR', 'Désactiver', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'es-ES', 'Desactivar', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'de-DE', 'Deaktivieren', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable', 'pt-PT', 'Desativar', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'en-GB', 'Enable', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'en-US', 'Enable', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'it-IT', 'Abilita', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'fr-FR', 'Activer', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'es-ES', 'Activar', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'de-DE', 'Aktivieren', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable', 'pt-PT', 'Ativar', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'en-GB', 'Disabling…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'en-US', 'Disabling…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'it-IT', 'Disabilitazione…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'fr-FR', 'Désactivation…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'es-ES', 'Desactivando…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'de-DE', 'Deaktivierung…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disabling', 'pt-PT', 'A desativar…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'en-GB', 'Enabling…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'en-US', 'Enabling…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'it-IT', 'Abilitazione…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'fr-FR', 'Activation…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'es-ES', 'Activando…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'de-DE', 'Aktivierung…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enabling', 'pt-PT', 'A ativar…', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'en-GB', 'Are you sure you want to disable {entity}{name}? You can re-enable it from the Deleted view.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'en-US', 'Are you sure you want to disable {entity}{name}? You can re-enable it from the Deleted view.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'it-IT', 'Sei sicuro di voler disabilitare {entity}{name}? Puoi riabilitarlo dalla vista Eliminati.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'fr-FR', 'Voulez-vous vraiment désactiver {entity}{name} ? Vous pourrez le réactiver depuis la vue Supprimés.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'es-ES', '¿Seguro que quieres desactivar {entity}{name}? Puedes reactivarlo desde la vista Eliminados.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'de-DE', 'Möchten Sie {entity}{name} wirklich deaktivieren? Sie können es in der Ansicht „Gelöscht“ wieder aktivieren.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_confirm', 'pt-PT', 'Tem a certeza de que deseja desativar {entity}{name}? Pode reativá-lo na vista Eliminados.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'en-GB', 'Are you sure you want to disable {count} {entity}? You can re-enable them from the Deleted view.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'en-US', 'Are you sure you want to disable {count} {entity}? You can re-enable them from the Deleted view.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'it-IT', 'Sei sicuro di voler disabilitare {count} {entity}? Puoi riabilitarle dalla vista Eliminati.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'fr-FR', 'Voulez-vous vraiment désactiver {count} {entity} ? Vous pourrez les réactiver depuis la vue Supprimés.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'es-ES', '¿Seguro que quieres desactivar {count} {entity}? Puedes reactivarlas desde la vista Eliminados.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'de-DE', 'Möchten Sie {count} {entity} wirklich deaktivieren? Sie können sie in der Ansicht „Gelöscht“ wieder aktivieren.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.disable_entities_confirm', 'pt-PT', 'Tem a certeza de que deseja desativar {count} {entity}? Pode reativá-los na vista Eliminados.', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'en-GB', 'Are you sure you want to enable {entity}{name}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'en-US', 'Are you sure you want to enable {entity}{name}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'it-IT', 'Sei sicuro di voler abilitare {entity}{name}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'fr-FR', 'Voulez-vous vraiment activer {entity}{name} ?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'es-ES', '¿Seguro que quieres activar {entity}{name}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'de-DE', 'Möchten Sie {entity}{name} wirklich aktivieren?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_confirm', 'pt-PT', 'Tem a certeza de que deseja ativar {entity}{name}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'en-GB', 'Are you sure you want to enable {count} {entity}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'en-US', 'Are you sure you want to enable {count} {entity}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'it-IT', 'Sei sicuro di voler abilitare {count} {entity}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'fr-FR', 'Voulez-vous vraiment activer {count} {entity} ?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'es-ES', '¿Seguro que quieres activar {count} {entity}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'de-DE', 'Möchten Sie {count} {entity} wirklich aktivieren?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.actions.enable_entities_confirm', 'pt-PT', 'Tem a certeza de que deseja ativar {count} {entity}?', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'en-GB', 'Next value', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'en-US', 'Next value', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'it-IT', 'Prossimo valore', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'fr-FR', 'Prochaine valeur', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'es-ES', 'Próximo valor', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'de-DE', 'Nächster Wert', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_next', 'pt-PT', 'Próximo valor', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'en-GB', 'Current value', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'en-US', 'Current value', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'it-IT', 'Valore attuale', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'fr-FR', 'Valeur actuelle', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'es-ES', 'Valor actual', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'de-DE', 'Aktueller Wert', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.value_actual', 'pt-PT', 'Valor atual', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'en-GB', 'Emitted (next)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'en-US', 'Emitted (next)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'it-IT', 'Emesso (prossimo)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'fr-FR', 'Émis (prochain)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'es-ES', 'Emitido (próximo)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'de-DE', 'Ausgegeben (nächster)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_next', 'pt-PT', 'Emitido (próximo)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'en-GB', 'Emitted (current)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'en-US', 'Emitted (current)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'it-IT', 'Emesso (attuale)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'fr-FR', 'Émis (actuel)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'es-ES', 'Emitido (actual)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'de-DE', 'Ausgegeben (aktuell)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.emitted_actual', 'pt-PT', 'Emitido (atual)', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'en-GB', 'Last allocated at', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'en-US', 'Last allocated at', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'it-IT', 'Ultima assegnazione il', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'fr-FR', 'Dernière attribution le', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'es-ES', 'Última asignación el', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'de-DE', 'Letzte Vergabe am', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_at', 'pt-PT', 'Última atribuição em', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'en-GB', 'Last allocated by', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'en-US', 'Last allocated by', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'it-IT', 'Ultima assegnazione da', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'fr-FR', 'Dernière attribution par', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'es-ES', 'Última asignación por', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'de-DE', 'Letzte Vergabe von', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.last_alloc_by', 'pt-PT', 'Última atribuição por', now(), 'migration-sequence-actions-i18n', now(), 'migration-sequence-actions-i18n', 1);

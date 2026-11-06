-- Trigger disable/enable confirm-dialog keys — `meta.actions_overrides`
-- `confirm_key`/`busy_key` drive the dialog copy from the SAME op chrome
-- as the CTA (no "Elimina" drift when the op renders "Disattiva").
-- Single templates use {entity}{name} markers (EntityConfirmQuestion),
-- bulk templates use {count} {entity}. Disable copy notes the action is
-- reversible (restore exists) — unlike delete's "cannot be undone".
BEGIN;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT * FROM (VALUES
('job.entities.job_trigger.actions.disable_confirm', 'en-GB', 'Are you sure you want to disable {entity}{name}? You can re-enable it from the Deleted view.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'en-US', 'Are you sure you want to disable {entity}{name}? You can re-enable it from the Deleted view.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'it-IT', 'Sei sicuro di voler disattivare {entity}{name}? Puoi riattivarlo dalla vista Eliminati.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'de-DE', 'Möchten Sie {entity}{name} wirklich deaktivieren? Sie können ihn in der Ansicht „Gelöscht“ wieder aktivieren.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'fr-FR', 'Voulez-vous vraiment désactiver {entity}{name} ? Vous pourrez le réactiver depuis la vue Supprimés.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'es-ES', '¿Seguro que quieres desactivar {entity}{name}? Puedes reactivarlo desde la vista Eliminados.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_confirm', 'pt-PT', 'Tem a certeza de que deseja desativar {entity}{name}? Pode reativá-lo na vista Eliminados.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'en-GB', 'Are you sure you want to disable {count} {entity}? You can re-enable them from the Deleted view.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'en-US', 'Are you sure you want to disable {count} {entity}? You can re-enable them from the Deleted view.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'it-IT', 'Sei sicuro di voler disattivare {count} {entity}? Puoi riattivarli dalla vista Eliminati.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'de-DE', 'Möchten Sie {count} {entity} wirklich deaktivieren? Sie können sie in der Ansicht „Gelöscht“ wieder aktivieren.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'fr-FR', 'Voulez-vous vraiment désactiver {count} {entity} ? Vous pourrez les réactiver depuis la vue Supprimés.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'es-ES', '¿Seguro que quieres desactivar {count} {entity}? Puedes reactivarlos desde la vista Eliminados.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disable_entities_confirm', 'pt-PT', 'Tem a certeza de que deseja desativar {count} {entity}? Pode reativá-los na vista Eliminados.', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'en-GB', 'Are you sure you want to enable {entity}{name}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'en-US', 'Are you sure you want to enable {entity}{name}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'it-IT', 'Sei sicuro di voler attivare {entity}{name}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'de-DE', 'Möchten Sie {entity}{name} wirklich aktivieren?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'fr-FR', 'Voulez-vous vraiment activer {entity}{name} ?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'es-ES', '¿Seguro que quieres activar {entity}{name}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_confirm', 'pt-PT', 'Tem a certeza de que deseja ativar {entity}{name}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'en-GB', 'Are you sure you want to enable {count} {entity}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'en-US', 'Are you sure you want to enable {count} {entity}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'it-IT', 'Sei sicuro di voler attivare {count} {entity}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'de-DE', 'Möchten Sie {count} {entity} wirklich aktivieren?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'fr-FR', 'Voulez-vous vraiment activer {count} {entity} ?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'es-ES', '¿Seguro que quieres activar {count} {entity}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enable_entities_confirm', 'pt-PT', 'Tem a certeza de que deseja ativar {count} {entity}?', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'en-GB', 'Disabling…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'en-US', 'Disabling…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'it-IT', 'Disattivazione…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'de-DE', 'Deaktivieren…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'fr-FR', 'Désactivation…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'es-ES', 'Desactivando…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.disabling', 'pt-PT', 'A desativar…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'en-GB', 'Enabling…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'en-US', 'Enabling…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'it-IT', 'Attivazione…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'de-DE', 'Aktivieren…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'fr-FR', 'Activation…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'es-ES', 'Activando…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1),
('job.entities.job_trigger.actions.enabling', 'pt-PT', 'A ativar…', now(), 'trigger-confirm-keys', now(), 'trigger-confirm-keys', 1)
) AS v(key, language, value, created_at, created_by, updated_at, updated_by, version)
WHERE NOT EXISTS (
  SELECT 1 FROM job.translations t WHERE t.key = v.key AND t.language = v.language AND t.deleted_at IS NULL
);

COMMIT;

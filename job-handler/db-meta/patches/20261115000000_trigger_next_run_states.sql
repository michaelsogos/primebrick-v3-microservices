-- `job_trigger.next_run` null-state label (MetaColumn.null_label contract):
-- shown instead of "-" when the trigger is disabled.

BEGIN;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.fields.next_run.states.disabled', 'en-GB', 'Trigger disabled', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'en-US', 'Trigger disabled', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'it-IT', 'Trigger disabilitato', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'de-DE', 'Trigger deaktiviert', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'fr-FR', 'Déclencheur désactivé', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'es-ES', 'Trigger deshabilitado', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run.states.disabled', 'pt-PT', 'Trigger desativado', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

COMMIT;

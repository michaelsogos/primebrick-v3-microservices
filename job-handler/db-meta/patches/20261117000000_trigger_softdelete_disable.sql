-- Trigger enable/disable → soft-delete (doctrine: standalone enable flags
-- are a design error; `deleted_at` IS the disable signal).
--   1. disabled rows become soft-deleted (audit: deleted_by='system')
--   2. the `enabled` column drops
--   3. CTA chrome keys: delete→"Disable", restore→"Enable"
--      (`meta.actions_overrides` — cosmetics only).
-- IDEMPOTENT: column work is guarded on information_schema so a partially
-- applied environment does not fail the boot migration.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'job' AND table_name = 'job_triggers' AND column_name = 'enabled'
  ) THEN
    UPDATE job.job_triggers
    SET deleted_at = now(), deleted_by = 'system', updated_at = now()
    WHERE enabled = false AND deleted_at IS NULL;

    ALTER TABLE job.job_triggers DROP COLUMN enabled;
  END IF;
END $$;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT * FROM (VALUES
('job.entities.job_trigger.actions.disable', 'en-GB', 'Disable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'en-US', 'Disable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'it-IT', 'Disattiva', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'de-DE', 'Deaktivieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'fr-FR', 'Désactiver', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'es-ES', 'Desactivar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.disable', 'pt-PT', 'Desativar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'en-GB', 'Enable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'en-US', 'Enable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'it-IT', 'Attiva', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'de-DE', 'Aktivieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'fr-FR', 'Activer', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'es-ES', 'Activar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.actions.enable', 'pt-PT', 'Ativar', now(), 'initial-setup', now(), 'initial-setup', 1)
) AS v(key, language, value, created_at, created_by, updated_at, updated_by, version)
WHERE NOT EXISTS (
  SELECT 1 FROM job.translations t WHERE t.key = v.key AND t.language = v.language
);

COMMIT;

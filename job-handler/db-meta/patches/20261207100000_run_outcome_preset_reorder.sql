-- Primebrick: job_run outcome preset — monitor-first reorder.
--
-- The toolbar scope selector is re-ordered to the monitoring flow:
--   1. sent      — dispatched rows awaiting a handler (DEFAULT view)
--   2. succeeded — completed runs
--   3. failed    — aggregate problem bucket: status IN (failed,lost,skipped)
--   4. all       — escape option, unchanged
--
-- The single-status options `dispatched`/`skipped`/`lost` are absorbed:
-- `sent` owns dispatched, `failed` owns the rest. Their tooltip keys are
-- retired; `sent_tip` is new and `failed_tip` copy now spells out the
-- aggregate. Labels keep reusing `status.*` (aria fallback only — the
-- group is icon-only).

-- ── retired option tooltips ──────────────────────────────────────────
DELETE FROM job.translations WHERE key IN (
  'job.entities.job_run.presets.outcome.dispatched_tip',
  'job.entities.job_run.presets.outcome.skipped_tip',
  'job.entities.job_run.presets.outcome.lost_tip'
);

-- ── failed_tip — the aggregate now says what it covers ───────────────
UPDATE job.translations SET value = 'Failed, lost or skipped',                        updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Failed, lost or skipped',                        updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Falliti, persi o saltati',                       updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Échouées, perdues ou ignorées',                  updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Fallidas, perdidas u omitidas',                  updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Fehlgeschlagen, verloren oder übersprungen',     updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Falhadas, perdidas ou ignoradas',                updated_at = now(), updated_by = 'migration-run-page', version = version + 1 WHERE key = 'job.entities.job_run.presets.outcome.failed_tip' AND language = 'pt-PT' AND deleted_at IS NULL;

-- ── sent_tip — the new default view ──────────────────────────────────
INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'en-GB', 'Waiting to be processed',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'en-US', 'Waiting to be processed',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'it-IT', 'In attesa di essere processati', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'fr-FR', 'En attente de traitement',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'es-ES', 'En espera de procesamiento', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'de-DE', 'Warten auf Verarbeitung',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.sent_tip', 'pt-PT', 'À espera de processamento', now(), 'migration-run-page', now(), 'migration-run-page', 1);

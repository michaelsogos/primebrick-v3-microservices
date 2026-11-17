-- Primebrick: job_run schedule ref — physical drill anchor + real label.
--
-- The `schedule` column was bootstrapped as an alias of the arrival
-- subject: the cell displayed the raw NATS queue (identical to the
-- source column) and drilled through a business-key list lookup instead
-- of the uuid-ref anatomy `armed_by` sets on job_schedule. `schedule_uuid`
-- is now a PHYSICAL column stamped at write time (forwarder has the armed
-- schedule row in hand; own-lane recorder resolves it by subject), the
-- `schedule` @Calculated resolves the schedule's real display name (its
-- armer trigger's name — the schedule's own display_field), and the ref
-- drills by uuid like every sibling ref. Schedules are hard-deleted:
-- a dangling uuid lands on the record sheet's not-found hero while
-- `schedule_subject` keeps the raw arrival truth.
--
-- The column label is "Pianificatore" (the scheduler), not the entity
-- name.

ALTER TABLE "job"."job_runs" ADD COLUMN IF NOT EXISTS "schedule_uuid" uuid;

-- Live mirror join — only schedules that still exist can be backfilled;
-- dead ones keep their truth in `schedule_subject` by design.
UPDATE job.job_runs r SET schedule_uuid = js.uuid
  FROM job.job_schedules js
 WHERE js.schedule_subject = r.schedule_subject
   AND r.schedule_uuid IS NULL;

-- ── label: "Pianificatore" family ─────────────────────────────────────
UPDATE job.translations SET value = 'Scheduler',      updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'en-GB';
UPDATE job.translations SET value = 'Scheduler',      updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'en-US';
UPDATE job.translations SET value = 'Pianificatore',  updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'it-IT';
UPDATE job.translations SET value = 'Planificateur',  updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Planificador',   updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'es-ES';
UPDATE job.translations SET value = 'Planer',         updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'de-DE';
UPDATE job.translations SET value = 'Agendador',      updated_at = now(), updated_by = 'migration-run-lineage', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule' AND language = 'pt-PT';

-- fields.schedule_uuid — hidden drill key; same words as `schedule`
INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'en-GB', 'Scheduler',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'en-US', 'Scheduler',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'it-IT', 'Pianificatore', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'fr-FR', 'Planificateur', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'es-ES', 'Planificador',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'de-DE', 'Planer',        now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_uuid', 'pt-PT', 'Agendador',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1);

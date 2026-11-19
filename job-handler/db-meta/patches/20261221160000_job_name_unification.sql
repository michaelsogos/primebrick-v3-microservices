-- Primebrick: job identity unification — `name` becomes the physical,
-- mandatory declared identity on both lifecycle surfaces.
--
-- The `job_name` mixed-derivation model is retired:
--   * job_schedules gains a PHYSICAL `name` column — required in the
--     arm contract (`DeclareScheduleInput.name`), stamped verbatim at
--     arm time (the engine copies `job_triggers.name`). Backfill uses
--     the same COALESCE the removed @Calculated resolved: the owning
--     trigger's name first, the due-subject tail as the dead-key
--     fallback for rows whose trigger is physically gone.
--   * job_runs renames `job_name` → `name`; rows whose stamped lineage
--     resolves a trigger adopt its declared name (the old value held
--     the destination subject — honest data, wrong semantic).
--   * the i18n field keys follow the column rename (`fields.job_name`
--     → `fields.name`), with the audit triple the freshness contract
--     requires.

ALTER TABLE "job"."job_schedules" ADD COLUMN "name" text;

UPDATE job.job_schedules s
   SET name = COALESCE(
         (SELECT t.name FROM job.job_triggers t WHERE t.uuid = s.trigger_uuid),
         regexp_replace(s.target_subject, '^jobs\.due\.[^.]+\.[^.]+\.', '')
       )
 WHERE s.name IS NULL;

ALTER TABLE "job"."job_schedules" ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "job"."job_runs" RENAME COLUMN "job_name" TO "name";

-- Declared-name repair — runs whose lineage resolves a trigger carried
-- the destination subject verbatim; the trigger's `name` is the authored
-- identity these rows should always have displayed.
UPDATE job.job_runs r
   SET name = t.name
  FROM job.job_triggers t
 WHERE t.uuid = r.trigger_uuid;

-- i18n key rename follows the column rename (no live `fields.name` keys
-- exist for these entities → no collision possible; deleted rows ride
-- along so a restore never resurrects the stale key).
UPDATE job.translations
   SET key = 'job.entities.job_schedule.fields.name',
       updated_at = now(), updated_by = 'migration-job-name-unification', version = version + 1
 WHERE key = 'job.entities.job_schedule.fields.job_name';

UPDATE job.translations
   SET key = 'job.entities.job_run.fields.name',
       updated_at = now(), updated_by = 'migration-job-name-unification', version = version + 1
 WHERE key = 'job.entities.job_run.fields.job_name';

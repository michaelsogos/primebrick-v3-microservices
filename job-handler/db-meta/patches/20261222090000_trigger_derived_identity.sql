-- Primebrick: trigger-derived identity — `name` retires from schedules
-- and runs; `job_triggers.name` stays the ONE physical authored name
-- feeding the whole chain.
--
-- The declared-name stamp model is retired in favour of pure lineage:
--   * job_schedules.name DROPPED — the schedule's identity IS the owning
--     trigger's display name, resolved live via `trigger_uuid` (already
--     NOT NULL — every mirror is trigger-owned).
--   * job_runs.name DROPPED — same resolution via `trigger_uuid`.
--   * job_runs.trigger_uuid → NOT NULL — every run derives from a
--     trigger; the forwarder stamps it from the trampoline subject tail
--     (`jobs.due.<lane>.job.forward.<uuid>`) or the armed mirror, and
--     results carry `x-job-trigger-id` so lineage survives the mirror's
--     hard-delete. A result that cannot prove trigger lineage is dropped
--     by the recorder, never recorded unlinked.
--   * legacy pre-chain runs (service-generated rows from before the
--     governed TRIGGER → SCHEDULE → RUN chain) cannot be honestly
--     attributed — deleted dev data, never fabricated lineage.
--   * i18n: `fields.armed_by`/`hints.armed_by` → `trigger` (the schedule
--     display_field), adopting the run column's already-localized values;
--     the dead `fields.name` keys are soft-deleted.

-- Legacy runs without trigger lineage — honest deletion (dev data),
-- required before the NOT NULL below.
DELETE FROM job.job_runs WHERE trigger_uuid IS NULL;

ALTER TABLE "job"."job_runs" ALTER COLUMN "trigger_uuid" SET NOT NULL;

ALTER TABLE "job"."job_schedules" DROP COLUMN "name";
ALTER TABLE "job"."job_runs" DROP COLUMN "name";

-- i18n — the schedule `armed_by` key becomes `trigger` (display_field),
-- adopting the run column's per-language values ("Trigger" family) so the
-- identity header reads the same on both surfaces.
UPDATE job.translations s
   SET key = 'job.entities.job_schedule.fields.trigger',
       value = (SELECT r.value FROM job.translations r
                 WHERE r.key = 'job.entities.job_run.fields.trigger'
                   AND r.language = s.language
                   AND r.deleted_at IS NULL
                 LIMIT 1),
       updated_at = now(), updated_by = 'migration-trigger-derived-identity', version = version + 1
 WHERE s.key = 'job.entities.job_schedule.fields.armed_by';

UPDATE job.translations
   SET key = 'job.entities.job_schedule.hints.trigger',
       updated_at = now(), updated_by = 'migration-trigger-derived-identity', version = version + 1
 WHERE key = 'job.entities.job_schedule.hints.armed_by';

UPDATE job.translations
   SET key = 'job.entities.job_schedule.hints.trigger_title',
       updated_at = now(), updated_by = 'migration-trigger-derived-identity', version = version + 1
 WHERE key = 'job.entities.job_schedule.hints.armed_by_title';

-- Dead keys — `name` no longer exists on either entity.
UPDATE job.translations
   SET deleted_at = now(),
       deleted_by = 'migration-trigger-derived-identity',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key IN (
     'job.entities.job_schedule.fields.name',
     'job.entities.job_run.fields.name'
   );

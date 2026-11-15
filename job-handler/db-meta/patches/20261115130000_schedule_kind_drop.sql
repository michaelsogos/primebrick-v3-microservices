-- Primebrick: retire `job.job_schedules.kind` — the infra_derived/trigger
-- split is gone. Every schedule mirror is owned by a `job_triggers` row
-- (`trigger_uuid` NOT NULL): user-made triggers and module-declared
-- system triggers share ONE materialization path (the triggers engine).
-- The retired `jobs.ctl.schedule.request` external-declare route and the
-- `armJobSchedule` SDK helper had no remaining consumers.
--
-- Mirrors without an owning trigger are orphans by definition — the two
-- live ones are the retired AI infra schedule and a demo row, both
-- `disarmed` (their declarations are dead letters: nothing re-arms
-- them, and the boot reconcile would surface them as drift forever).

DELETE FROM "job"."job_schedules" WHERE "trigger_uuid" IS NULL;

ALTER TABLE "job"."job_schedules" DROP COLUMN "kind";
ALTER TABLE "job"."job_schedules" ALTER COLUMN "trigger_uuid" SET NOT NULL;

-- ------------------------------------------------- vocabulary cleanup
-- The `kind` field label/hint and its badge values leave the served meta.

DELETE FROM "job"."translations" WHERE key IN (
  'job.entities.job_schedule.fields.kind',
  'job.entities.job_schedule.hints.kind',
  'job.entities.job_schedule.hints.kind_title',
  'job.entities.job_schedule.values.infra_derived',
  'job.entities.job_schedule.values.trigger'
);

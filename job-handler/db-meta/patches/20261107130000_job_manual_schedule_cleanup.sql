-- 20261107130000 — manual-schedule surface cleanup.
--
-- The schedule-job action + schedules-create page were absorbed into
-- schedule-only job_triggers (kind:"manual" retired from DeclareScheduleInput;
-- the NATS schedule.request accepts infra_derived only). The labels that
-- fed the retired custom page go soft-deleted — `job_schedules` rows of
-- kind "manual" keep their amber badge via the surviving status.manual key.

BEGIN;

UPDATE "job"."translations"
  SET deleted_at = now(), deleted_by = 'migration-job-trigger-cleanup', updated_at = now(), updated_by = 'migration-job-trigger-cleanup', version = version + 1
  WHERE deleted_at IS NULL AND (
    key = 'job.jobs.scheduleNew'
    OR key LIKE 'job.jobs.scheduleDialog.%'
  );

COMMIT;

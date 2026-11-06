-- Engine-maintained next-fire mirror on job_schedules.
-- Written by schedule-service (arm/disarm) and the due-forwarder
-- (Nats-Schedule-Next header on every fired message — the server's own
-- truth, cron included). Backfill: @every/@at compute deterministically
-- from armed_at + spec; cron stays NULL until its first fire.
-- IDEMPOTENT: guarded on information_schema.

BEGIN;

ALTER TABLE job.job_schedules
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz;

UPDATE job.job_schedules
SET next_run_at = CASE
  WHEN schedule_spec ~ '^@at\s' THEN substring(schedule_spec from '@at\s+(\S+)')::timestamptz
  WHEN schedule_spec ~ '^@every\s+[0-9]+[smhd]\s*$' THEN
    armed_at + (substring(schedule_spec from '@every\s+([0-9]+)')::int *
      CASE substring(schedule_spec from '@every\s+[0-9]+([smhd])')
        WHEN 's' THEN interval '1 second'
        WHEN 'm' THEN interval '1 minute'
        WHEN 'h' THEN interval '1 hour'
        WHEN 'd' THEN interval '1 day'
      END)
END
WHERE status = 'armed'
  AND next_run_at IS NULL
  AND armed_at IS NOT NULL;

COMMIT;

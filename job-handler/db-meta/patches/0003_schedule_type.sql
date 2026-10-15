-- 0003 — job_schedules.schedule_type: recurring vs once drives the admin
-- page split (JOBS RECURRING / JOBS EXECUTED ONCE) and is server-filterable.
BEGIN;

ALTER TABLE "job"."job_schedules"
  ADD COLUMN IF NOT EXISTS "schedule_type" varchar(10) NOT NULL DEFAULT 'recurring';

COMMIT;

-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:07:14.026Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_schedules" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_schedules" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_runs" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_runs" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_triggers" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."job_triggers" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "job"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();

-- WARN: DB-only index "job_schedules_subject_uq" on job.job_schedules — not dropped
-- WARN: DB-only index "job_schedules_status_idx" on job.job_schedules — not dropped
-- WARN: DB-only index "job_runs_status_idx" on job.job_runs — not dropped
-- WARN: DB-only index "job_runs_schedule_idx" on job.job_runs — not dropped

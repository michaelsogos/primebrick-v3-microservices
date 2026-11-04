-- 20261111000000 — run-result correlation + schedule lifecycle columns.
--
-- job_schedules:
--   fired_at    — when a `once` schedule actually dispatched (status → fired;
--                 the declaration self-purges, the mirror must not pretend armed)
--   expires_at  — armed_at + Nats-Schedule-TTL: when the declaration
--                 self-purges (expected absence, not drift)
--
-- job_runs:
--   schedule_subject → NULLABLE: immediate event dispatches carry no schedule
--   fire_seq          — stream sequence of the consumed fire (dedupes result
--                       reports per fire on redelivery)
--
-- uuid-keyed trigger subjects: `jobs.schedule.job.<name>` rows migrate to
-- `jobs.schedule.job.<trigger_uuid>` — stable across renames, no tombstones.
-- The old name-keyed declarations still live in NATS become orphans: the
-- boot reconcile's strict orphan-purge removes them (by design).

BEGIN;

ALTER TABLE "job"."job_schedules" ADD COLUMN IF NOT EXISTS "fired_at" timestamptz;
ALTER TABLE "job"."job_schedules" ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;

ALTER TABLE "job"."job_runs" ALTER COLUMN "schedule_subject" DROP NOT NULL;
ALTER TABLE "job"."job_runs" ADD COLUMN IF NOT EXISTS "fire_seq" bigint;

UPDATE "job"."job_schedules"
  SET "schedule_subject" = 'jobs.schedule.job.' || "trigger_uuid"::text
  WHERE "kind" = 'trigger'
    AND "trigger_uuid" IS NOT NULL
    AND "schedule_subject" <> 'jobs.schedule.job.' || "trigger_uuid"::text;

COMMIT;

-- Primebrick: retire `job.job_schedules.service_code` — the last remnant of
-- the service-armed world. Since `trigger_uuid` went NOT NULL every schedule
-- mirror is trigger-owned by construction, and the column's only consumers
-- were the `armed_by` / `armed_ref_key` service fallbacks (dead branches).
-- The namespace it denormalized is already carried by `schedule_subject`
-- (`jobs.schedule.<owner>.<name>`) — a second copy is a second truth.
--
-- `armed_by` is now resolved by the entity's own projection: the owning
-- trigger's name through `trigger_uuid`, falling back to the raw key when
-- the trigger row is physically gone. The ref drills statically to
-- `job_trigger` (`ref.entity` + `key_field: trigger_uuid`) — the
-- `armed_ref_entity`/`armed_ref_key` lazy wire helpers are gone too.

ALTER TABLE "job"."job_schedules" DROP COLUMN "service_code";

-- ------------------------------------------------- vocabulary cleanup
-- The `service_code` field label and the retired lazy-ref helper labels
-- leave the served meta (the columns no longer exist).

DELETE FROM "job"."translations" WHERE key IN (
  'job.entities.job_schedule.fields.service_code',
  'job.entities.job_schedule.fields.armed_ref_entity',
  'job.entities.job_schedule.fields.armed_ref_key'
);

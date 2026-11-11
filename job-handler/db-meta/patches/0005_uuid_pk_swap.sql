-- Primebrick: job-handler uuid phase 4+5 — uuid becomes the PRIMARY KEY.
-- DROP COLUMN id removes the legacy PK constraint, the identity clause and
-- the owned sequence in one shot. ADD PRIMARY KEY (uuid) names the new
-- constraint <table>_pkey automatically. The now-redundant *_uuid_uq
-- UNIQUE CONSTRAINTS drop (constraint-backed here, not bare indexes).
-- No physical FKs and no *_id refs exist in this schema — nothing else to
-- rewire. Audit parents drop entity_id (entity_uuid twin is already
-- populated on every row; DROP on the parent propagates to partitions).

ALTER TABLE "job"."job_triggers" DROP COLUMN "id";
ALTER TABLE "job"."job_triggers" DROP CONSTRAINT "job_triggers_uuid_uq";
ALTER TABLE "job"."job_triggers" ADD PRIMARY KEY ("uuid");

ALTER TABLE "job"."job_schedules" DROP COLUMN "id";
ALTER TABLE "job"."job_schedules" DROP CONSTRAINT "job_schedules_uuid_uq";
ALTER TABLE "job"."job_schedules" ADD PRIMARY KEY ("uuid");

ALTER TABLE "job"."job_runs" DROP COLUMN "id";
ALTER TABLE "job"."job_runs" DROP CONSTRAINT "job_runs_uuid_uq";
ALTER TABLE "job"."job_runs" ADD PRIMARY KEY ("uuid");

ALTER TABLE "job"."config_entries" DROP COLUMN "id";
ALTER TABLE "job"."config_entries" DROP CONSTRAINT "config_entries_uuid_uq";
ALTER TABLE "job"."config_entries" ADD PRIMARY KEY ("uuid");

ALTER TABLE "job"."job_triggers_audit"  DROP COLUMN "entity_id";
ALTER TABLE "job"."job_schedules_audit" DROP COLUMN "entity_id";
ALTER TABLE "job"."job_runs_audit"      DROP COLUMN "entity_id";

-- Primebrick: audit rows get a uuidv7 `uuid` row key, PK becomes
-- (uuid, changed_at) and the surrogate bigint `id` is eradicated — same
-- shape the DAL now emits for every {entity}_audit table.
-- ADD COLUMN propagates to partitions; uuidv7() is volatile so existing
-- rows are rewritten with a distinct key each. DROP COLUMN id removes the
-- identity clause and the owned sequence.
--
-- job_runs_audit / job_schedules_audit are ORPHANED parents: JobRunEntity
-- and JobScheduleEntity have no @AuditTrail (the run row IS its own
-- trail) — drop parents (partitions go with them), part_config rows and
-- the stale templates.
--
-- job_triggers_audit's partman template is still named after the renamed
-- job_rules_audit table and carries the dead id/entity_id shape — rebuild
-- it from the migrated parent so future partitions get the uuid shape.
--
-- Audit retention is intrinsic: every {entity}_audit parent keeps 12
-- months and drops expired partitions (retention_keep_table = false).

ALTER TABLE "job"."job_triggers_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "job"."job_triggers_audit" DROP CONSTRAINT "job_triggers_audit_pkey";
ALTER TABLE "job"."job_triggers_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "job"."job_triggers_audit" DROP COLUMN "id";

DELETE FROM partman.part_config
 WHERE parent_table IN ('job.job_runs_audit', 'job.job_schedules_audit');
DROP TABLE "job"."job_runs_audit";
DROP TABLE "job"."job_schedules_audit";
DROP TABLE IF EXISTS "partman"."template_job_job_runs_audit";
DROP TABLE IF EXISTS "partman"."template_job_job_schedules_audit";

DROP TABLE "partman"."template_job_job_rules_audit";
CREATE TABLE "partman"."template_job_job_rules_audit"
  (LIKE "job"."job_triggers_audit" INCLUDING ALL);
UPDATE partman.part_config
   SET retention = '12 months', retention_keep_table = false
 WHERE parent_table = 'job.job_triggers_audit';

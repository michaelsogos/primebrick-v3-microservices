-- 0010 — audit trail tables for the job domain entities.
--
-- job_rule / job_schedule / job_run are declared `Auditable` (entity classes
-- and `entities-route.ts`), and the entity router exposes `/:uuid/audit` —
-- but the `{table}_audit` tables were never created. The DAL writer is
-- fire-and-forget so writes silently logged errors; the read path
-- (`findAuditPage` on `job.job_runs_audit`) raised
-- `relation does not exist` in the version-history UI.
--
-- Structure mirrors the BE audit tables (customers_audit & co.):
--   (id, changed_at) PK · RANGE-partitioned monthly via pg_partman ·
--   entity_uuid + action indexes · explicit DEFAULT partition so inserts
--   never fail before partman premakes the next month.

BEGIN;

-- ─── job_rules_audit ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "job"."job_rules_audit" (
  "id"         bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "entity_id"  bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action"     text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version"    integer NOT NULL,
  "delta"      jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

COMMENT ON COLUMN job.job_rules_audit.changed_by IS 'Identifier of the principal that produced the audit entry (falls back to "system" when no authenticated context is available).';

CREATE INDEX IF NOT EXISTS "job_rules_audit_entity_uuid_idx" ON "job"."job_rules_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "job_rules_audit_action_idx" ON "job"."job_rules_audit" ("action");

CREATE TABLE IF NOT EXISTS "job"."job_rules_audit_default"
  PARTITION OF "job"."job_rules_audit" DEFAULT;

-- ─── job_schedules_audit ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "job"."job_schedules_audit" (
  "id"         bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "entity_id"  bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action"     text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version"    integer NOT NULL,
  "delta"      jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

COMMENT ON COLUMN job.job_schedules_audit.changed_by IS 'Identifier of the principal that produced the audit entry (falls back to "system" when no authenticated context is available).';

CREATE INDEX IF NOT EXISTS "job_schedules_audit_entity_uuid_idx" ON "job"."job_schedules_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "job_schedules_audit_action_idx" ON "job"."job_schedules_audit" ("action");

CREATE TABLE IF NOT EXISTS "job"."job_schedules_audit_default"
  PARTITION OF "job"."job_schedules_audit" DEFAULT;

-- ─── job_runs_audit ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "job"."job_runs_audit" (
  "id"         bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "entity_id"  bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action"     text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version"    integer NOT NULL,
  "delta"      jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

COMMENT ON COLUMN job.job_runs_audit.changed_by IS 'Identifier of the principal that produced the audit entry (falls back to "system" when no authenticated context is available).';

CREATE INDEX IF NOT EXISTS "job_runs_audit_entity_uuid_idx" ON "job"."job_runs_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "job_runs_audit_action_idx" ON "job"."job_runs_audit" ("action");

CREATE TABLE IF NOT EXISTS "job"."job_runs_audit_default"
  PARTITION OF "job"."job_runs_audit" DEFAULT;

-- ─── pg_partman setup (idempotent, skips silently when not configured) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman'
    AND table_name = 'part_config'
  ) OR NOT EXISTS (
    SELECT 1 FROM partman.part_config
    WHERE parent_table = 'job.job_rules_audit'
  ) THEN
    PERFORM partman.create_parent('job.job_rules_audit', 'changed_at', '1 month');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman'
    AND table_name = 'part_config'
  ) OR NOT EXISTS (
    SELECT 1 FROM partman.part_config
    WHERE parent_table = 'job.job_schedules_audit'
  ) THEN
    PERFORM partman.create_parent('job.job_schedules_audit', 'changed_at', '1 month');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman'
    AND table_name = 'part_config'
  ) OR NOT EXISTS (
    SELECT 1 FROM partman.part_config
    WHERE parent_table = 'job.job_runs_audit'
  ) THEN
    PERFORM partman.create_parent('job.job_runs_audit', 'changed_at', '1 month');
  END IF;
EXCEPTION WHEN others THEN
  -- If pg_partman is not properly configured, skip silently — the DEFAULT
  -- partitions still accept rows until partman is set up.
  NULL;
END $$;

COMMIT;

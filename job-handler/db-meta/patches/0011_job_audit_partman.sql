-- 0011 — register the job.*_audit tables with pg_partman (monthly partitions).
--
-- 0010 created explicit DEFAULT partitions so inserts never fail without
-- partman. `partman.create_parent` manages its own default partition
-- (p_default_table=true) and refuses a pre-existing one — "is already a
-- partition" — so the manually-created defaults are detached+dropped first
-- (they were created empty moments ago in 0010: zero data is lost), then
-- create_parent re-creates the default plus the premade monthly partitions,
-- exactly like the BE audit tables (customers_audit & co.).
--
-- Environments without pg_partman skip entirely and keep the 0010 default
-- partition as the catch-all.

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman' AND table_name = 'part_config'
  ) THEN
    FOREACH t IN ARRAY ARRAY[
      'job.job_rules_audit',
      'job.job_schedules_audit',
      'job.job_runs_audit'
    ] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM partman.part_config WHERE parent_table = t
      ) THEN
        -- partman-managed default may not exist as a partition already
        EXECUTE format('ALTER TABLE %s DETACH PARTITION %s_default', t, t);
        EXECUTE format('DROP TABLE IF EXISTS %s_default', t);
        PERFORM partman.create_parent(t, 'changed_at', '1 month');
      END IF;
    END LOOP;
  END IF;
END $$;

COMMIT;

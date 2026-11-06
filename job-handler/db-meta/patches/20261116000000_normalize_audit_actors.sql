-- Normalize audit actors in job.* tables to the DAL convention
-- (`user_profiles.uuid` or `"system"`):
--   `user:<uuid>`            → bare uuid
--   `user:<email>` resolvable → the profile uuid
--   `user:<email>` orphan    → 'system'
-- Prefixed system actors (`service:*`, `system:*`, `rule:*`, `trigger:*`)
-- and legacy dev actors are left untouched — the `<key>_name` join's
-- COALESCE-to-raw fallback already renders them.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.normalize_actor(a text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN a ~ '^user:[0-9a-fA-F-]{36}$' THEN substring(a from 6)
    WHEN a ~ '^user:.+@.+$' THEN COALESCE(
      (SELECT up.uuid::text FROM public.user_profiles up WHERE up.email = substring(a from 6)),
      'system')
    ELSE a
  END
$$;

DO $$
DECLARE
  t text;
  c text;
BEGIN
  FOREACH t IN ARRAY ARRAY['job.job_triggers', 'job.job_schedules', 'job.job_runs'] LOOP
    FOREACH c IN ARRAY ARRAY['created_by', 'updated_by', 'deleted_by'] LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = split_part(t, '.', 1)
          AND table_name = split_part(t, '.', 2)
          AND column_name = c
      ) THEN
        EXECUTE format(
          'UPDATE %s SET %I = pg_temp.normalize_actor(%I) WHERE %I LIKE ''user:%%''',
          t, c, c, c);
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- Primebrick: job-handler uuid phase 6 — rewrite existing uuid values v4→v7.
-- Temp map old→new covers every entity-PK uuid; refs are rewritten via map
-- join so stale/lazy refs (audit entity_uuid of deleted triggers) stay
-- untouched as history — match-preservation, not zero-dangling.
-- translations.uuid is the wire row key but nothing references it → pure swap.
-- Audit parents UPDATE propagates to partman partitions.
-- Gates (DO block): PK/translations columns end all-v7; every live-matching
-- ref becomes v7; per-ref dangling count identical before/after.

CREATE TEMP TABLE _uuid_map (old uuid PRIMARY KEY, new uuid NOT NULL) ON COMMIT DROP;

INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "job"."job_triggers" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "job"."job_schedules" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "job"."job_runs" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "job"."config_entries" WHERE uuid_extract_version("uuid") <> 7;

CREATE TEMP TABLE _before (ref text PRIMARY KEY, dangling bigint) ON COMMIT DROP;

INSERT INTO _before SELECT 'trigger_uuid', count(*) FROM "job"."job_schedules" s
  WHERE s.trigger_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_triggers" t WHERE t.uuid = s.trigger_uuid);
INSERT INTO _before SELECT 'job_triggers_audit.entity_uuid', count(*) FROM "job"."job_triggers_audit" a
  WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_triggers" t WHERE t.uuid = a.entity_uuid);
INSERT INTO _before SELECT 'job_schedules_audit.entity_uuid', count(*) FROM "job"."job_schedules_audit" a
  WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_schedules" t WHERE t.uuid = a.entity_uuid);
INSERT INTO _before SELECT 'job_runs_audit.entity_uuid', count(*) FROM "job"."job_runs_audit" a
  WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_runs" t WHERE t.uuid = a.entity_uuid);

UPDATE "job"."translations" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;

UPDATE "job"."job_schedules" s SET "trigger_uuid" = m.new FROM _uuid_map m WHERE s.trigger_uuid = m.old;

UPDATE "job"."job_triggers_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "job"."job_schedules_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "job"."job_runs_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;

UPDATE "job"."job_triggers" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "job"."job_schedules" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "job"."job_runs" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "job"."config_entries" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "job"."job_triggers" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "job"."job_schedules" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "job"."job_runs" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "job"."config_entries" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "job"."translations" WHERE uuid_extract_version("uuid") <> 7) THEN
    RAISE EXCEPTION 'phase6 gate: non-v7 uuid remains in a rewritten column';
  END IF;

  IF EXISTS (SELECT 1 FROM "job"."job_schedules" s
             WHERE s.trigger_uuid IS NOT NULL AND uuid_extract_version(s.trigger_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "job"."job_triggers" t WHERE t.uuid = s.trigger_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: live-matching ref left non-v7';
  END IF;

  IF (SELECT dangling FROM _before WHERE ref = 'trigger_uuid') <>
     (SELECT count(*) FROM "job"."job_schedules" s
      WHERE s.trigger_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_triggers" t WHERE t.uuid = s.trigger_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: trigger_uuid dangling count changed';
  END IF;

  IF (SELECT dangling FROM _before WHERE ref = 'job_triggers_audit.entity_uuid') <>
     (SELECT count(*) FROM "job"."job_triggers_audit" a
      WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "job"."job_triggers" t WHERE t.uuid = a.entity_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: job_triggers_audit dangling count changed';
  END IF;
END $$;

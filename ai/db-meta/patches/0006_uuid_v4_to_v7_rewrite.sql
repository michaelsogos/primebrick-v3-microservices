-- Primebrick: ai uuid phase 6 — rewrite existing uuid values v4→v7.
-- Temp map old→new covers every entity-PK uuid; refs are rewritten via map
-- join so stale/lazy refs stay untouched as history — match-preservation.
-- translations.uuid is the wire row key but nothing references it → pure swap.
-- Partitioned ai_conversations: UPDATE on the parent propagates to partitions;
-- audit parents propagate to their partitions the same way.
-- EXCLUDED on purpose: ai_telemetry.user_uuid references
-- public.user_profiles.uuid (cross-schema) — it is rewritten by the be patch
-- which owns the user_profiles map (approved decision A1). Its values stay
-- v4 until then and keep matching live user_profiles uuids.

CREATE TEMP TABLE _uuid_map (old uuid PRIMARY KEY, new uuid NOT NULL) ON COMMIT DROP;

INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_cerebellum" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_conversations" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_messages" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_feedback" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_models" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."ai_telemetry" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "ai"."config_entries" WHERE uuid_extract_version("uuid") <> 7;

CREATE TEMP TABLE _before (ref text PRIMARY KEY, dangling bigint) ON COMMIT DROP;

INSERT INTO _before SELECT 'ai_messages.conversation_uuid', count(*) FROM "ai"."ai_messages" m
  WHERE m.conversation_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = m.conversation_uuid);
INSERT INTO _before SELECT 'ai_telemetry.conversation_uuid', count(*) FROM "ai"."ai_telemetry" t
  WHERE t.conversation_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = t.conversation_uuid);
INSERT INTO _before SELECT 'ai_feedback.conversation_uuid', count(*) FROM "ai"."ai_feedback" f
  WHERE f.conversation_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = f.conversation_uuid);
INSERT INTO _before SELECT 'ai_feedback.message_uuid', count(*) FROM "ai"."ai_feedback" f
  WHERE f.message_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_messages" m WHERE m.uuid = f.message_uuid);
INSERT INTO _before SELECT 'ai_models_audit.entity_uuid', count(*) FROM "ai"."ai_models_audit" a
  WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_models" m WHERE m.uuid = a.entity_uuid);
INSERT INTO _before SELECT 'ai_cerebellum_audit.entity_uuid', count(*) FROM "ai"."ai_cerebellum_audit" a
  WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_cerebellum" c WHERE c.uuid = a.entity_uuid);

UPDATE "ai"."translations" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;

UPDATE "ai"."ai_messages" m SET "conversation_uuid" = map.new FROM _uuid_map map WHERE m.conversation_uuid = map.old;
UPDATE "ai"."ai_telemetry" t SET "conversation_uuid" = map.new FROM _uuid_map map WHERE t.conversation_uuid = map.old;
UPDATE "ai"."ai_feedback" f SET "conversation_uuid" = map.new FROM _uuid_map map WHERE f.conversation_uuid = map.old;
UPDATE "ai"."ai_feedback" f SET "message_uuid" = map.new FROM _uuid_map map WHERE f.message_uuid = map.old;

UPDATE "ai"."ai_models_audit" a SET "entity_uuid" = map.new FROM _uuid_map map WHERE a.entity_uuid = map.old;
UPDATE "ai"."ai_cerebellum_audit" a SET "entity_uuid" = map.new FROM _uuid_map map WHERE a.entity_uuid = map.old;

UPDATE "ai"."ai_cerebellum" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."ai_conversations" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."ai_messages" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."ai_feedback" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."ai_models" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."ai_telemetry" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;
UPDATE "ai"."config_entries" t SET "uuid" = map.new FROM _uuid_map map WHERE t.uuid = map.old;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ai"."ai_cerebellum" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."ai_conversations" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."ai_messages" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."ai_feedback" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."ai_models" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."ai_telemetry" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."config_entries" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "ai"."translations" WHERE uuid_extract_version("uuid") <> 7) THEN
    RAISE EXCEPTION 'phase6 gate: non-v7 uuid remains in a rewritten column';
  END IF;

  -- same-schema live-matching refs must be v7; ai_telemetry.user_uuid is
  -- intentionally excluded (cross-schema, handled by the be patch).
  IF EXISTS (SELECT 1 FROM "ai"."ai_messages" m
             WHERE m.conversation_uuid IS NOT NULL AND uuid_extract_version(m.conversation_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = m.conversation_uuid))
  OR EXISTS (SELECT 1 FROM "ai"."ai_telemetry" t
             WHERE t.conversation_uuid IS NOT NULL AND uuid_extract_version(t.conversation_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = t.conversation_uuid))
  OR EXISTS (SELECT 1 FROM "ai"."ai_feedback" f
             WHERE f.conversation_uuid IS NOT NULL AND uuid_extract_version(f.conversation_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = f.conversation_uuid))
  OR EXISTS (SELECT 1 FROM "ai"."ai_feedback" f
             WHERE f.message_uuid IS NOT NULL AND uuid_extract_version(f.message_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_messages" m WHERE m.uuid = f.message_uuid))
  OR EXISTS (SELECT 1 FROM "ai"."ai_models_audit" a
             WHERE a.entity_uuid IS NOT NULL AND uuid_extract_version(a.entity_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_models" m WHERE m.uuid = a.entity_uuid))
  OR EXISTS (SELECT 1 FROM "ai"."ai_cerebellum_audit" a
             WHERE a.entity_uuid IS NOT NULL AND uuid_extract_version(a.entity_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "ai"."ai_cerebellum" c WHERE c.uuid = a.entity_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: live-matching ref left non-v7';
  END IF;

  IF (SELECT dangling FROM _before WHERE ref = 'ai_messages.conversation_uuid') <>
     (SELECT count(*) FROM "ai"."ai_messages" m
      WHERE m.conversation_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_conversations" c WHERE c.uuid = m.conversation_uuid))
  OR (SELECT dangling FROM _before WHERE ref = 'ai_models_audit.entity_uuid') <>
     (SELECT count(*) FROM "ai"."ai_models_audit" a
      WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_models" m WHERE m.uuid = a.entity_uuid))
  OR (SELECT dangling FROM _before WHERE ref = 'ai_cerebellum_audit.entity_uuid') <>
     (SELECT count(*) FROM "ai"."ai_cerebellum_audit" a
      WHERE a.entity_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "ai"."ai_cerebellum" c WHERE c.uuid = a.entity_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: dangling ref count changed (match-preservation violated)';
  END IF;
END $$;

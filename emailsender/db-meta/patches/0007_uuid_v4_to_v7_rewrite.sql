-- Primebrick: emailsender uuid phase 6 — rewrite existing uuid values v4→v7.
-- Doctrine: one transaction (engine-wrapped); a temp map old→new covers every
-- entity-PK uuid; *_uuid refs are rewritten via map join so stale/lazy refs
-- (values whose target row no longer exists) stay untouched as history —
-- match-preservation, not zero-dangling. translations.uuid is the wire row
-- key but nothing references it → pure swap. sender_log.entity_uuid is the
-- polymorphic ref (all NULL today) → excluded by design.
-- Gates (DO block): PK/translations columns end all-v7; every live-matching
-- ref becomes v7; per-ref dangling count identical before/after.

CREATE TEMP TABLE _uuid_map (old uuid PRIMARY KEY, new uuid NOT NULL) ON COMMIT DROP;

INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "emailsender"."providers" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "emailsender"."email_templates" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "emailsender"."config_entries" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "emailsender"."sender_log" WHERE uuid_extract_version("uuid") <> 7;

CREATE TEMP TABLE _before (ref text PRIMARY KEY, dangling bigint) ON COMMIT DROP;

INSERT INTO _before SELECT 'provider_uuid', count(*) FROM "emailsender"."sender_log" s
  WHERE s.provider_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "emailsender"."providers" p WHERE p.uuid = s.provider_uuid);
INSERT INTO _before SELECT 'template_uuid', count(*) FROM "emailsender"."sender_log" s
  WHERE s.template_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "emailsender"."email_templates" t WHERE t.uuid = s.template_uuid);

UPDATE "emailsender"."translations" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;

UPDATE "emailsender"."sender_log" s SET "provider_uuid" = m.new FROM _uuid_map m WHERE s.provider_uuid = m.old;
UPDATE "emailsender"."sender_log" s SET "template_uuid" = m.new FROM _uuid_map m WHERE s.template_uuid = m.old;

UPDATE "emailsender"."providers" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "emailsender"."email_templates" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "emailsender"."config_entries" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "emailsender"."sender_log" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "emailsender"."providers" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "emailsender"."email_templates" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "emailsender"."config_entries" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "emailsender"."sender_log" WHERE uuid_extract_version("uuid") <> 7)
  OR EXISTS (SELECT 1 FROM "emailsender"."translations" WHERE uuid_extract_version("uuid") <> 7) THEN
    RAISE EXCEPTION 'phase6 gate: non-v7 uuid remains in a rewritten column';
  END IF;

  IF EXISTS (SELECT 1 FROM "emailsender"."sender_log" s
             WHERE s.provider_uuid IS NOT NULL AND uuid_extract_version(s.provider_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "emailsender"."providers" p WHERE p.uuid = s.provider_uuid))
  OR EXISTS (SELECT 1 FROM "emailsender"."sender_log" s
             WHERE s.template_uuid IS NOT NULL AND uuid_extract_version(s.template_uuid) <> 7
               AND EXISTS (SELECT 1 FROM "emailsender"."email_templates" t WHERE t.uuid = s.template_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: live-matching ref left non-v7';
  END IF;

  IF (SELECT dangling FROM _before WHERE ref = 'provider_uuid') <>
     (SELECT count(*) FROM "emailsender"."sender_log" s
      WHERE s.provider_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "emailsender"."providers" p WHERE p.uuid = s.provider_uuid))
  OR (SELECT dangling FROM _before WHERE ref = 'template_uuid') <>
     (SELECT count(*) FROM "emailsender"."sender_log" s
      WHERE s.template_uuid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "emailsender"."email_templates" t WHERE t.uuid = s.template_uuid)) THEN
    RAISE EXCEPTION 'phase6 gate: dangling ref count changed (match-preservation violated)';
  END IF;
END $$;

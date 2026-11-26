-- Primebrick: re-key self-materialized sequence rows to their
-- DETERMINISTIC uuid (`sequenceBoundUuid(seed)` — sha256 of
-- 'primebrick.sequence|<seed>' formatted uuid v5-style). Bound rows seed
-- on `<table>.<field>`; expr-materialized rows seed on
-- `<table>.<field>|expr|<hash16>` (their name is
-- `<table>.<field>@expr_<hash16>`). Operator-authored rows keep their
-- uuidv7 — only derived rows re-key; counters and audit follow the row.
-- No-op where the deterministic row already exists or no derived row is
-- present — the write path materializes fresh rows on the same
-- deterministic identity, so this upgrade is exactly-once semantics.

CREATE OR REPLACE FUNCTION crm.__seq_det_uuid(seed text) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    substr(h, 1, 8) || '-' || substr(h, 9, 4) || '-5' || substr(h, 14, 3) || '-' ||
    to_hex(((get_byte(d, 8) >> 4) & 3) | 8) || substr(h, 18, 3) || '-' || substr(h, 21, 12)
  )::uuid
  FROM (
    SELECT encode(d, 'hex') AS h, d
    FROM (SELECT digest('primebrick.sequence|' || seed, 'sha256') AS d) AS digest_row
  ) AS hex_row
$$;

DO $$
DECLARE
  r record;
  new_uuid uuid;
BEGIN
  FOR r IN
    SELECT uuid, name,
           CASE WHEN name ~ '^(.+)@expr_[0-9a-f]{16}$'
                THEN regexp_replace(name, '^(.+)@expr_([0-9a-f]{16})$', '\1|expr|\2')
                ELSE name END AS seed
    FROM crm.sequences
    WHERE name = 'customers.code'
       OR name ~ '^customers\.code@expr_[0-9a-f]{16}$'
  LOOP
    new_uuid := crm.__seq_det_uuid(r.seed);
    IF r.uuid <> new_uuid
       AND NOT EXISTS (SELECT 1 FROM crm.sequences WHERE uuid = new_uuid) THEN
      UPDATE crm.sequences SET uuid = new_uuid WHERE uuid = r.uuid;
      UPDATE crm.sequence_counters SET sequence_uuid = new_uuid WHERE sequence_uuid = r.uuid;
      UPDATE crm.sequences_audit SET entity_uuid = new_uuid WHERE entity_uuid = r.uuid;
    END IF;
  END LOOP;
END $$;

DROP FUNCTION crm.__seq_det_uuid(text);

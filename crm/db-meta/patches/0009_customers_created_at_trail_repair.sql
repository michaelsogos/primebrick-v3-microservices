-- customers created_at trail repair — the seeded dataset carries a
-- corrupted `created_at`: a one-off mass rewrite stamped every seeded row
-- (created_by='system') with the same instant 2026-05-16 19:37:55.813234,
-- while the intended history lives in crm.customers_audit (INSERT rows at
-- scattered times, the canonical "creation" events for this dataset).
-- 113/164 rows violate created_at <= updated_at and ALL 138 seeded rows
-- disagree with their audit trail.
--
-- Repair aligns `created_at` to the row's own INSERT audit event so row
-- and trail tell the same story. Predicate is the mass-rewrite instant,
-- not created_at > updated_at — "healthy-looking" seeded rows carry the
-- same wrong stamp and would stay inconsistent with their trail.
-- Rows without an INSERT audit row are untouched by construction (the
-- FROM-join simply does not match).

UPDATE crm.customers c
SET created_at = sub.first_insert
FROM (
  SELECT entity_uuid, MIN(changed_at) AS first_insert
  FROM crm.customers_audit
  WHERE action = 'INSERT'
  GROUP BY entity_uuid
) sub
WHERE sub.entity_uuid = c.uuid
  AND c.created_at = '2026-05-16 19:37:55.813234+00'::timestamptz;

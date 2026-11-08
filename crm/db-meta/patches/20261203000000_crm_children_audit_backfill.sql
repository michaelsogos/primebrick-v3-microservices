-- Primebrick CRM: audit-trail backfill for migration-created child rows
--
-- 20261125000000_customer_flat_to_children moved flat customer columns
-- into child entity tables (local_addresses, customer_contacts,
-- customer_accounts) but wrote no audit rows — same seed-audit gap as
-- the dictionaries. Provenance per convention: the trail author is the
-- same actor stamped in created_by/updated_by — `t.created_by` (the
-- migration's own stamp). changed_at = the row's created_at.

BEGIN;

INSERT INTO crm.local_addresses_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, t.created_by, t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.local_addresses t
WHERE NOT EXISTS (SELECT 1 FROM crm.local_addresses_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.customer_contacts_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, t.created_by, t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.customer_contacts t
WHERE NOT EXISTS (SELECT 1 FROM crm.customer_contacts_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.customer_accounts_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, t.created_by, t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.customer_accounts t
WHERE NOT EXISTS (SELECT 1 FROM crm.customer_accounts_audit a WHERE a.entity_uuid = t.uuid);

COMMIT;

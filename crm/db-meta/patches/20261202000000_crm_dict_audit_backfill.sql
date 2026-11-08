-- Primebrick CRM: audit-trail backfill for seeded dictionary rows
--
-- Every seed must also write the audit trail — the dict seeds
-- (20261107180000_seed_dictionaries + the legal_forms ISO20275 seeds)
-- inserted rows directly and never produced the INSERT audit rows, so
-- the version-history sheet (`GET /:uuid/audit`) renders EMPTY for every
-- dictionary entry. Same convention as the config_entries seed audit
-- block (00000000000007-era): action='INSERT', version=row.version,
-- delta = every column {old:null,new:value}, idempotent via NOT EXISTS.

BEGIN;

-- Shared per-table shape: dict tables are (id, uuid, <cols...>, sort, audit cols)
-- so the delta is built dynamically with to_jsonb — identical output to the
-- hand-enumerated precedent, without re-listing columns per table.

INSERT INTO crm.customer_types_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.customer_types t
WHERE NOT EXISTS (SELECT 1 FROM crm.customer_types_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.company_dimensions_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.company_dimensions t
WHERE NOT EXISTS (SELECT 1 FROM crm.company_dimensions_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.legal_forms_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.legal_forms t
WHERE NOT EXISTS (SELECT 1 FROM crm.legal_forms_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.local_address_types_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.local_address_types t
WHERE NOT EXISTS (SELECT 1 FROM crm.local_address_types_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.qualifications_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.qualifications t
WHERE NOT EXISTS (SELECT 1 FROM crm.qualifications_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.marketing_qualifications_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.marketing_qualifications t
WHERE NOT EXISTS (SELECT 1 FROM crm.marketing_qualifications_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.contact_types_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.contact_types t
WHERE NOT EXISTS (SELECT 1 FROM crm.contact_types_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.account_kinds_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.account_kinds t
WHERE NOT EXISTS (SELECT 1 FROM crm.account_kinds_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.customer_link_types_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.customer_link_types t
WHERE NOT EXISTS (SELECT 1 FROM crm.customer_link_types_audit a WHERE a.entity_uuid = t.uuid);

INSERT INTO crm.consent_types_audit (entity_id, entity_uuid, action, changed_at, changed_by, version, delta)
SELECT t.id, t.uuid, 'INSERT', t.created_at, 'initial-setup', t.version,
  jsonb_strip_nulls((SELECT jsonb_object_agg(kv.key, jsonb_build_object('old', null, 'new', kv.value)) FROM jsonb_each(to_jsonb(t)) kv))
FROM crm.consent_types t
WHERE NOT EXISTS (SELECT 1 FROM crm.consent_types_audit a WHERE a.entity_uuid = t.uuid);

COMMIT;

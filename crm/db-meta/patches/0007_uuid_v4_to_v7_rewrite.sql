-- Primebrick: crm uuid phase 6 — rewrite existing uuid values v4→v7.
-- Temp map old→new covers every entity-PK uuid; refs are rewritten via map
-- join so stale/lazy refs stay untouched as history — match-preservation.
-- translations.uuid is the wire row key but nothing references it → pure swap.
-- The 8 physical *_uuid_fkey constraints are ON UPDATE NO ACTION → they are
-- dropped before the rewrite and recreated after with original semantics
-- (same pattern as 0006_uuid_pk_swap).
-- Gates (DO block): PK/translations columns end all-v7; every live-matching
-- ref becomes v7; per-ref dangling count identical before/after; 8 FKs back.

-- ── Phase A: drop the uuid FK mirrors (NO ACTION on update) ────────────────
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_contact_uuid_fkey;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_customer_uuid_fkey;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_local_address_uuid_fkey;
ALTER TABLE crm.customer_consents  DROP CONSTRAINT customer_consents_customer_uuid_fkey;
ALTER TABLE crm.customer_contacts  DROP CONSTRAINT customer_contacts_customer_uuid_fkey;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_child_uuid_fkey;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_parent_uuid_fkey;
ALTER TABLE crm.local_addresses    DROP CONSTRAINT local_addresses_customer_uuid_fkey;

-- ── Phase B: map + dangling baseline ───────────────────────────────────────
CREATE TEMP TABLE _uuid_map (old uuid PRIMARY KEY, new uuid NOT NULL) ON COMMIT DROP;

INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."account_kinds" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."company_dimensions" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."config_entries" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."consent_types" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."contact_types" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_accounts" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_consents" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_contacts" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_link_types" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_links" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customer_types" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."customers" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."legal_forms" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."local_address_types" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."local_addresses" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."marketing_qualifications" WHERE uuid_extract_version("uuid") <> 7;
INSERT INTO _uuid_map SELECT "uuid", uuidv7() FROM "crm"."qualifications" WHERE uuid_extract_version("uuid") <> 7;

CREATE TEMP TABLE _before (ref text PRIMARY KEY, dangling bigint) ON COMMIT DROP;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('customer_accounts','contact_uuid','customer_contacts'),
    ('customer_accounts','customer_uuid','customers'),
    ('customer_accounts','kind_uuid','account_kinds'),
    ('customer_accounts','legal_form_uuid','legal_forms'),
    ('customer_accounts','local_address_uuid','local_addresses'),
    ('customer_consents','customer_uuid','customers'),
    ('customer_consents','type_uuid','consent_types'),
    ('customer_contacts','customer_uuid','customers'),
    ('customer_contacts','type_uuid','contact_types'),
    ('customer_links','child_customer_uuid','customers'),
    ('customer_links','parent_customer_uuid','customers'),
    ('customers','cloned_from','customers'),
    ('customers','company_dimension_uuid','company_dimensions'),
    ('customers','customer_type_uuid','customer_types'),
    ('customers','marketing_qualification_uuid','marketing_qualifications'),
    ('customers','qualification_uuid','qualifications'),
    ('local_addresses','customer_uuid','customers'),
    ('local_addresses','type_uuid','local_address_types'),
    ('account_kinds_audit','entity_uuid','account_kinds'),
    ('company_dimensions_audit','entity_uuid','company_dimensions'),
    ('consent_types_audit','entity_uuid','consent_types'),
    ('contact_types_audit','entity_uuid','contact_types'),
    ('customer_accounts_audit','entity_uuid','customer_accounts'),
    ('customer_consents_audit','entity_uuid','customer_consents'),
    ('customer_contacts_audit','entity_uuid','customer_contacts'),
    ('customer_link_types_audit','entity_uuid','customer_link_types'),
    ('customer_links_audit','entity_uuid','customer_links'),
    ('customer_types_audit','entity_uuid','customer_types'),
    ('customers_audit','entity_uuid','customers'),
    ('legal_forms_audit','entity_uuid','legal_forms'),
    ('local_address_types_audit','entity_uuid','local_address_types'),
    ('local_addresses_audit','entity_uuid','local_addresses'),
    ('marketing_qualifications_audit','entity_uuid','marketing_qualifications'),
    ('qualifications_audit','entity_uuid','qualifications')
  ) AS t(tbl, col, tgt)
  LOOP
    EXECUTE format(
      'INSERT INTO _before SELECT %L, count(*) FROM crm.%I s WHERE s.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm.%I x WHERE x.uuid = s.%I)',
      r.tbl || '.' || r.col, r.tbl, r.col, r.tgt, r.col);
  END LOOP;
END $$;

-- ── Phase C: translations pure swap ────────────────────────────────────────
UPDATE "crm"."translations" SET "uuid" = uuidv7() WHERE uuid_extract_version("uuid") <> 7;

-- ── Phase D: ref rewrite via map (stale refs don't match → preserved) ──────
UPDATE "crm"."customer_accounts" s SET "contact_uuid" = m.new FROM _uuid_map m WHERE s.contact_uuid = m.old;
UPDATE "crm"."customer_accounts" s SET "customer_uuid" = m.new FROM _uuid_map m WHERE s.customer_uuid = m.old;
UPDATE "crm"."customer_accounts" s SET "kind_uuid" = m.new FROM _uuid_map m WHERE s.kind_uuid = m.old;
UPDATE "crm"."customer_accounts" s SET "legal_form_uuid" = m.new FROM _uuid_map m WHERE s.legal_form_uuid = m.old;
UPDATE "crm"."customer_accounts" s SET "local_address_uuid" = m.new FROM _uuid_map m WHERE s.local_address_uuid = m.old;
UPDATE "crm"."customer_consents" s SET "customer_uuid" = m.new FROM _uuid_map m WHERE s.customer_uuid = m.old;
UPDATE "crm"."customer_consents" s SET "type_uuid" = m.new FROM _uuid_map m WHERE s.type_uuid = m.old;
UPDATE "crm"."customer_contacts" s SET "customer_uuid" = m.new FROM _uuid_map m WHERE s.customer_uuid = m.old;
UPDATE "crm"."customer_contacts" s SET "type_uuid" = m.new FROM _uuid_map m WHERE s.type_uuid = m.old;
UPDATE "crm"."customer_links" s SET "child_customer_uuid" = m.new FROM _uuid_map m WHERE s.child_customer_uuid = m.old;
UPDATE "crm"."customer_links" s SET "parent_customer_uuid" = m.new FROM _uuid_map m WHERE s.parent_customer_uuid = m.old;
UPDATE "crm"."customers" s SET "cloned_from" = m.new FROM _uuid_map m WHERE s.cloned_from = m.old;
UPDATE "crm"."customers" s SET "company_dimension_uuid" = m.new FROM _uuid_map m WHERE s.company_dimension_uuid = m.old;
UPDATE "crm"."customers" s SET "customer_type_uuid" = m.new FROM _uuid_map m WHERE s.customer_type_uuid = m.old;
UPDATE "crm"."customers" s SET "marketing_qualification_uuid" = m.new FROM _uuid_map m WHERE s.marketing_qualification_uuid = m.old;
UPDATE "crm"."customers" s SET "qualification_uuid" = m.new FROM _uuid_map m WHERE s.qualification_uuid = m.old;
UPDATE "crm"."local_addresses" s SET "customer_uuid" = m.new FROM _uuid_map m WHERE s.customer_uuid = m.old;
UPDATE "crm"."local_addresses" s SET "type_uuid" = m.new FROM _uuid_map m WHERE s.type_uuid = m.old;

-- ── Phase E: audit entity_uuid rewrite via map ─────────────────────────────
UPDATE "crm"."account_kinds_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."company_dimensions_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."consent_types_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."contact_types_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_accounts_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_consents_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_contacts_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_link_types_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_links_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customer_types_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."customers_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."legal_forms_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."local_address_types_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."local_addresses_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."marketing_qualifications_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;
UPDATE "crm"."qualifications_audit" a SET "entity_uuid" = m.new FROM _uuid_map m WHERE a.entity_uuid = m.old;

-- ── Phase F: PK rewrite via map ────────────────────────────────────────────
UPDATE "crm"."account_kinds" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."company_dimensions" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."config_entries" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."consent_types" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."contact_types" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_accounts" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_consents" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_contacts" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_link_types" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_links" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customer_types" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."customers" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."legal_forms" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."local_address_types" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."local_addresses" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."marketing_qualifications" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;
UPDATE "crm"."qualifications" t SET "uuid" = m.new FROM _uuid_map m WHERE t.uuid = m.old;

-- ── Phase G: recreate the uuid FKs with original semantics ─────────────────
ALTER TABLE crm.customer_accounts
  ADD CONSTRAINT customer_accounts_contact_uuid_fkey
  FOREIGN KEY (contact_uuid) REFERENCES crm.customer_contacts(uuid) ON DELETE RESTRICT;
ALTER TABLE crm.customer_accounts
  ADD CONSTRAINT customer_accounts_customer_uuid_fkey
  FOREIGN KEY (customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;
ALTER TABLE crm.customer_accounts
  ADD CONSTRAINT customer_accounts_local_address_uuid_fkey
  FOREIGN KEY (local_address_uuid) REFERENCES crm.local_addresses(uuid) ON DELETE RESTRICT;
ALTER TABLE crm.customer_consents
  ADD CONSTRAINT customer_consents_customer_uuid_fkey
  FOREIGN KEY (customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;
ALTER TABLE crm.customer_contacts
  ADD CONSTRAINT customer_contacts_customer_uuid_fkey
  FOREIGN KEY (customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;
ALTER TABLE crm.customer_links
  ADD CONSTRAINT customer_links_child_uuid_fkey
  FOREIGN KEY (child_customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;
ALTER TABLE crm.customer_links
  ADD CONSTRAINT customer_links_parent_uuid_fkey
  FOREIGN KEY (parent_customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;
ALTER TABLE crm.local_addresses
  ADD CONSTRAINT local_addresses_customer_uuid_fkey
  FOREIGN KEY (customer_uuid) REFERENCES crm.customers(uuid) ON DELETE CASCADE;

-- ── Phase H: gates ─────────────────────────────────────────────────────────
DO $$
DECLARE r record; n bigint;
BEGIN
  -- every rewritten PK / translations column ends all-v7
  FOR r IN SELECT unnest(ARRAY[
    'account_kinds','company_dimensions','config_entries','consent_types',
    'contact_types','customer_accounts','customer_consents','customer_contacts',
    'customer_link_types','customer_links','customer_types','customers',
    'legal_forms','local_address_types','local_addresses',
    'marketing_qualifications','qualifications','translations']) AS tbl
  LOOP
    EXECUTE format('SELECT count(*) FROM crm.%I WHERE uuid_extract_version("uuid") <> 7', r.tbl) INTO n;
    IF n > 0 THEN RAISE EXCEPTION 'phase6 gate: % non-v7 uuids remain in crm.%', n, r.tbl; END IF;
  END LOOP;

  -- per-ref: live-matching refs all v7 + dangling count preserved
  FOR r IN SELECT tbl, col, tgt FROM (VALUES
    ('customer_accounts','contact_uuid','customer_contacts'),
    ('customer_accounts','customer_uuid','customers'),
    ('customer_accounts','kind_uuid','account_kinds'),
    ('customer_accounts','legal_form_uuid','legal_forms'),
    ('customer_accounts','local_address_uuid','local_addresses'),
    ('customer_consents','customer_uuid','customers'),
    ('customer_consents','type_uuid','consent_types'),
    ('customer_contacts','customer_uuid','customers'),
    ('customer_contacts','type_uuid','contact_types'),
    ('customer_links','child_customer_uuid','customers'),
    ('customer_links','parent_customer_uuid','customers'),
    ('customers','cloned_from','customers'),
    ('customers','company_dimension_uuid','company_dimensions'),
    ('customers','customer_type_uuid','customer_types'),
    ('customers','marketing_qualification_uuid','marketing_qualifications'),
    ('customers','qualification_uuid','qualifications'),
    ('local_addresses','customer_uuid','customers'),
    ('local_addresses','type_uuid','local_address_types'),
    ('account_kinds_audit','entity_uuid','account_kinds'),
    ('company_dimensions_audit','entity_uuid','company_dimensions'),
    ('consent_types_audit','entity_uuid','consent_types'),
    ('contact_types_audit','entity_uuid','contact_types'),
    ('customer_accounts_audit','entity_uuid','customer_accounts'),
    ('customer_consents_audit','entity_uuid','customer_consents'),
    ('customer_contacts_audit','entity_uuid','customer_contacts'),
    ('customer_link_types_audit','entity_uuid','customer_link_types'),
    ('customer_links_audit','entity_uuid','customer_links'),
    ('customer_types_audit','entity_uuid','customer_types'),
    ('customers_audit','entity_uuid','customers'),
    ('legal_forms_audit','entity_uuid','legal_forms'),
    ('local_address_types_audit','entity_uuid','local_address_types'),
    ('local_addresses_audit','entity_uuid','local_addresses'),
    ('marketing_qualifications_audit','entity_uuid','marketing_qualifications'),
    ('qualifications_audit','entity_uuid','qualifications')
  ) AS t(tbl, col, tgt)
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM crm.%I s WHERE s.%I IS NOT NULL AND uuid_extract_version(s.%I) <> 7 AND EXISTS (SELECT 1 FROM crm.%I x WHERE x.uuid = s.%I)',
      r.tbl, r.col, r.col, r.tgt, r.col) INTO n;
    IF n > 0 THEN RAISE EXCEPTION 'phase6 gate: % live-matching refs left non-v7 in crm.%.%', n, r.tbl, r.col; END IF;
    EXECUTE format(
      'SELECT count(*) FROM crm.%I s WHERE s.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM crm.%I x WHERE x.uuid = s.%I)',
      r.tbl, r.col, r.tgt, r.col) INTO n;
    IF n <> (SELECT dangling FROM _before WHERE ref = r.tbl || '.' || r.col) THEN
      RAISE EXCEPTION 'phase6 gate: dangling count changed for crm.%.% (before=%, after=%)',
        r.tbl, r.col, (SELECT dangling FROM _before WHERE ref = r.tbl || '.' || r.col), n;
    END IF;
  END LOOP;

  SELECT count(*) INTO n FROM pg_constraint
  WHERE conname LIKE '%_uuid_fkey' AND connamespace = 'crm'::regnamespace;
  IF n <> 8 THEN RAISE EXCEPTION 'phase6 gate: expected 8 uuid FKs recreated, found %', n; END IF;
END $$;

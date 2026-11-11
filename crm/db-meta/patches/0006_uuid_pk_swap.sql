-- Primebrick: crm phase-4+5 — uuid primary-key swap + *_id ref drops
--
-- Every crm entity table drops the bigint surrogate `id` PK; `uuid`
-- (uuidv7, NOT NULL, populated since phase-1) becomes PRIMARY KEY.
-- The 8 phase-2 `*_id` reference columns drop together with their FKs;
-- the `*_uuid_fkey` mirrors are REBUILT (they depend on the bare
-- `*_uuid_uq` indexes being dropped — drop → PK swap → recreate).
-- `translations` keeps its bigint `id` (internal store, never referenced).
-- Audit parents drop `entity_id` (entity_uuid 100% populated, verified).

-- ── Safety assert: audit entity_uuid completeness ──────────────────────────
DO $$
DECLARE r record; n int;
BEGIN
  FOR r IN SELECT relname FROM pg_class WHERE relkind='p'
    AND relnamespace='crm'::regnamespace AND relname LIKE '%_audit' LOOP
    EXECUTE format('SELECT count(*) FROM crm.%I WHERE entity_uuid IS NULL', r.relname) INTO n;
    IF n > 0 THEN RAISE EXCEPTION '% has % NULL entity_uuid rows — abort', r.relname, n; END IF;
  END LOOP;
END $$;

-- ── Phase A: drop FKs on both sides of the swap ────────────────────────────
-- uuid-twin FKs (recreated in Phase C after the referenced uuid_uq index is
-- replaced by the PK):
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_contact_uuid_fkey;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_customer_uuid_fkey;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_local_address_uuid_fkey;
ALTER TABLE crm.customer_consents  DROP CONSTRAINT customer_consents_customer_uuid_fkey;
ALTER TABLE crm.customer_contacts  DROP CONSTRAINT customer_contacts_customer_uuid_fkey;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_child_uuid_fkey;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_parent_uuid_fkey;
ALTER TABLE crm.local_addresses    DROP CONSTRAINT local_addresses_customer_uuid_fkey;
-- legacy *_id FKs (dropped for good):
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_address_fk;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_customer_fk;
ALTER TABLE crm.customer_accounts  DROP CONSTRAINT customer_accounts_contact_fk;
ALTER TABLE crm.customer_consents  DROP CONSTRAINT customer_consents_customer_fk;
ALTER TABLE crm.customer_contacts  DROP CONSTRAINT customer_contacts_customer_fk;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_child_fk;
ALTER TABLE crm.customer_links     DROP CONSTRAINT customer_links_parent_fk;
ALTER TABLE crm.local_addresses    DROP CONSTRAINT local_addresses_customer_fk;

-- ── Phase B: PK swap + surrogate drops per entity table ────────────────────
ALTER TABLE crm.account_kinds DROP CONSTRAINT account_kinds_pkey;
DROP INDEX crm.account_kinds_uuid_uq;
ALTER TABLE crm.account_kinds ADD PRIMARY KEY (uuid);
ALTER TABLE crm.account_kinds DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.account_kinds_id_seq;

ALTER TABLE crm.company_dimensions DROP CONSTRAINT company_dimensions_pkey;
DROP INDEX crm.company_dimensions_uuid_uq;
ALTER TABLE crm.company_dimensions ADD PRIMARY KEY (uuid);
ALTER TABLE crm.company_dimensions DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.company_dimensions_id_seq;

ALTER TABLE crm.config_entries DROP CONSTRAINT config_entries_pkey;
ALTER TABLE crm.config_entries DROP CONSTRAINT crm_config_entries_uuid_uq;
ALTER TABLE crm.config_entries ADD PRIMARY KEY (uuid);
ALTER TABLE crm.config_entries DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.config_entries_id_seq;

ALTER TABLE crm.consent_types DROP CONSTRAINT consent_types_pkey;
DROP INDEX crm.consent_types_uuid_uq;
ALTER TABLE crm.consent_types ADD PRIMARY KEY (uuid);
ALTER TABLE crm.consent_types DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.consent_types_id_seq;

ALTER TABLE crm.contact_types DROP CONSTRAINT contact_types_pkey;
DROP INDEX crm.contact_types_uuid_uq;
ALTER TABLE crm.contact_types ADD PRIMARY KEY (uuid);
ALTER TABLE crm.contact_types DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.contact_types_id_seq;

ALTER TABLE crm.customer_accounts DROP CONSTRAINT customer_accounts_pkey;
DROP INDEX crm.customer_accounts_uuid_uq;
ALTER TABLE crm.customer_accounts ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_accounts DROP COLUMN id;
ALTER TABLE crm.customer_accounts DROP COLUMN customer_id;
ALTER TABLE crm.customer_accounts DROP COLUMN local_address_id;
ALTER TABLE crm.customer_accounts DROP COLUMN contact_id;
DROP SEQUENCE IF EXISTS crm.customer_accounts_id_seq;

ALTER TABLE crm.customer_consents DROP CONSTRAINT customer_consents_pkey;
DROP INDEX crm.customer_consents_uuid_uq;
ALTER TABLE crm.customer_consents ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_consents DROP COLUMN id;
ALTER TABLE crm.customer_consents DROP COLUMN customer_id;
DROP SEQUENCE IF EXISTS crm.customer_consents_id_seq;

ALTER TABLE crm.customer_contacts DROP CONSTRAINT customer_contacts_pkey;
DROP INDEX crm.customer_contacts_uuid_uq;
ALTER TABLE crm.customer_contacts ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_contacts DROP COLUMN id;
ALTER TABLE crm.customer_contacts DROP COLUMN customer_id;
DROP SEQUENCE IF EXISTS crm.customer_contacts_id_seq;

ALTER TABLE crm.customer_links DROP CONSTRAINT customer_links_pkey;
DROP INDEX crm.customer_links_uuid_uq;
ALTER TABLE crm.customer_links ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_links DROP COLUMN id;
ALTER TABLE crm.customer_links DROP COLUMN parent_customer_id;
ALTER TABLE crm.customer_links DROP COLUMN child_customer_id;
DROP SEQUENCE IF EXISTS crm.customer_links_id_seq;

ALTER TABLE crm.customer_link_types DROP CONSTRAINT customer_link_types_pkey;
DROP INDEX crm.customer_link_types_uuid_uq;
ALTER TABLE crm.customer_link_types ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_link_types DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.customer_link_types_id_seq;

ALTER TABLE crm.customer_types DROP CONSTRAINT customer_types_pkey;
DROP INDEX crm.customer_types_uuid_uq;
ALTER TABLE crm.customer_types ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customer_types DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.customer_types_id_seq;

ALTER TABLE crm.customers DROP CONSTRAINT customers_pkey;
DROP INDEX crm.customers_uuid_uq;
ALTER TABLE crm.customers ADD PRIMARY KEY (uuid);
ALTER TABLE crm.customers DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.customers_id_seq;

ALTER TABLE crm.legal_forms DROP CONSTRAINT legal_forms_pkey;
DROP INDEX crm.legal_forms_uuid_uq;
ALTER TABLE crm.legal_forms ADD PRIMARY KEY (uuid);
ALTER TABLE crm.legal_forms DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.legal_forms_id_seq;

ALTER TABLE crm.local_addresses DROP CONSTRAINT local_addresses_pkey;
DROP INDEX crm.local_addresses_uuid_uq;
ALTER TABLE crm.local_addresses ADD PRIMARY KEY (uuid);
ALTER TABLE crm.local_addresses DROP COLUMN id;
ALTER TABLE crm.local_addresses DROP COLUMN customer_id;
DROP SEQUENCE IF EXISTS crm.local_addresses_id_seq;

ALTER TABLE crm.local_address_types DROP CONSTRAINT local_address_types_pkey;
DROP INDEX crm.local_address_types_uuid_uq;
ALTER TABLE crm.local_address_types ADD PRIMARY KEY (uuid);
ALTER TABLE crm.local_address_types DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.local_address_types_id_seq;

ALTER TABLE crm.marketing_qualifications DROP CONSTRAINT marketing_qualifications_pkey;
DROP INDEX crm.marketing_qualifications_uuid_uq;
ALTER TABLE crm.marketing_qualifications ADD PRIMARY KEY (uuid);
ALTER TABLE crm.marketing_qualifications DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.marketing_qualifications_id_seq;

ALTER TABLE crm.qualifications DROP CONSTRAINT qualifications_pkey;
DROP INDEX crm.qualifications_uuid_uq;
ALTER TABLE crm.qualifications ADD PRIMARY KEY (uuid);
ALTER TABLE crm.qualifications DROP COLUMN id;
DROP SEQUENCE IF EXISTS crm.qualifications_id_seq;

-- ── Phase C: recreate the uuid FK mirrors (backed by the new PKs) ──────────
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

-- ── Phase D: required refs (their bigint twins were NOT NULL) ──────────────
ALTER TABLE crm.customer_accounts  ALTER COLUMN customer_uuid        SET NOT NULL;
ALTER TABLE crm.customer_consents  ALTER COLUMN customer_uuid        SET NOT NULL;
ALTER TABLE crm.customer_contacts  ALTER COLUMN customer_uuid        SET NOT NULL;
ALTER TABLE crm.customer_links     ALTER COLUMN parent_customer_uuid SET NOT NULL;
ALTER TABLE crm.customer_links     ALTER COLUMN child_customer_uuid  SET NOT NULL;
ALTER TABLE crm.local_addresses    ALTER COLUMN customer_uuid        SET NOT NULL;

-- ── Phase E: audit entity_id drops (entity_uuid is the join key) ───────────
ALTER TABLE crm.account_kinds_audit             DROP COLUMN entity_id;
ALTER TABLE crm.company_dimensions_audit        DROP COLUMN entity_id;
ALTER TABLE crm.consent_types_audit             DROP COLUMN entity_id;
ALTER TABLE crm.contact_types_audit             DROP COLUMN entity_id;
ALTER TABLE crm.customer_accounts_audit         DROP COLUMN entity_id;
ALTER TABLE crm.customer_consents_audit         DROP COLUMN entity_id;
ALTER TABLE crm.customer_contacts_audit         DROP COLUMN entity_id;
ALTER TABLE crm.customer_link_types_audit       DROP COLUMN entity_id;
ALTER TABLE crm.customer_links_audit            DROP COLUMN entity_id;
ALTER TABLE crm.customer_types_audit            DROP COLUMN entity_id;
ALTER TABLE crm.customers_audit                 DROP COLUMN entity_id;
ALTER TABLE crm.legal_forms_audit               DROP COLUMN entity_id;
ALTER TABLE crm.local_address_types_audit       DROP COLUMN entity_id;
ALTER TABLE crm.local_addresses_audit           DROP COLUMN entity_id;
ALTER TABLE crm.marketing_qualifications_audit  DROP COLUMN entity_id;
ALTER TABLE crm.qualifications_audit            DROP COLUMN entity_id;

-- ── Phase F: translation keys follow the renamed columns ───────────────────
UPDATE crm.translations SET key = 'crm.entities.customer_account.fields.customer_uuid'      WHERE key = 'crm.entities.customer_account.fields.customer_id';
UPDATE crm.translations SET key = 'crm.entities.customer_account.fields.local_address_uuid' WHERE key = 'crm.entities.customer_account.fields.local_address_id';
UPDATE crm.translations SET key = 'crm.entities.customer_account.fields.contact_uuid'       WHERE key = 'crm.entities.customer_account.fields.contact_id';
UPDATE crm.translations SET key = 'crm.entities.customer_consent.fields.customer_uuid'      WHERE key = 'crm.entities.customer_consent.fields.customer_id';
UPDATE crm.translations SET key = 'crm.entities.customer_contact.fields.customer_uuid'      WHERE key = 'crm.entities.customer_contact.fields.customer_id';
UPDATE crm.translations SET key = 'crm.entities.customer_link.fields.parent_customer_uuid'  WHERE key = 'crm.entities.customer_link.fields.parent_customer_id';
UPDATE crm.translations SET key = 'crm.entities.customer_link.fields.child_customer_uuid'   WHERE key = 'crm.entities.customer_link.fields.child_customer_id';
UPDATE crm.translations SET key = 'crm.entities.local_address.fields.customer_uuid'         WHERE key = 'crm.entities.local_address.fields.customer_id';

-- 20261107182000 — entity label translations for the 15 new CRM entities.
-- Convention: audit/uuid columns resolve via `system.common.fields.*`
-- (already seeded platform-wide, not duplicated here). Entity-owned keys:
--   crm.entities.<entity>.{title,singular,plural,new.title,fields.<col>,
--   versionHistory.*}  +  crm.<leaf>.nav
-- Languages in this patch: en-GB, it-IT (+ en-US cloned from en-GB).
-- de-DE/fr-FR/es-ES/pt-PT land in follow-up per-language patches.
-- Generic versionHistory.* + fields.code are CLONED from the customer set
-- (identical boilerplate vocabulary, every language at once).

BEGIN;

-- ─── Clone: generic versionHistory.* + fields.code → 15 new entities ───────
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by")
SELECT replace(t.key, '.customer.', '.' || e.entity || '.'), t.language, t.value,
       'initial-setup', 'initial-setup'
FROM "crm"."translations" t
CROSS JOIN (VALUES
  ('customer_type'),('company_dimension'),('legal_form'),('local_address_type'),
  ('qualification'),('marketing_qualification'),('contact_type'),('account_kind'),
  ('customer_link_type'),('consent_type'),('local_address'),('customer_account'),
  ('customer_contact'),('customer_link'),('customer_consent')
) AS e(entity)
WHERE t.key IN (
  'crm.entities.customer.versionHistory.actions.CREATE',
  'crm.entities.customer.versionHistory.actions.DELETE',
  'crm.entities.customer.versionHistory.actions.HARD_DELETE',
  'crm.entities.customer.versionHistory.actions.INSERT',
  'crm.entities.customer.versionHistory.actions.RESTORE',
  'crm.entities.customer.versionHistory.actions.SOFT_DELETE',
  'crm.entities.customer.versionHistory.actions.UPDATE',
  'crm.entities.customer.versionHistory.changedFrom',
  'crm.entities.customer.versionHistory.cleared',
  'crm.entities.customer.versionHistory.empty',
  'crm.entities.customer.versionHistory.error',
  'crm.entities.customer.versionHistory.fieldModified',
  'crm.entities.customer.versionHistory.hideDetails',
  'crm.entities.customer.versionHistory.loading',
  'crm.entities.customer.versionHistory.notSet',
  'crm.entities.customer.versionHistory.null',
  'crm.entities.customer.versionHistory.recordCreated',
  'crm.entities.customer.versionHistory.recordDeleted',
  'crm.entities.customer.versionHistory.recordHardDeleted',
  'crm.entities.customer.versionHistory.recordRestored',
  'crm.entities.customer.versionHistory.recordSoftDeleted',
  'crm.entities.customer.versionHistory.set',
  'crm.entities.customer.versionHistory.showDetails',
  'crm.entities.customer.versionHistory.title',
  'crm.entities.customer.versionHistory.to',
  'crm.entities.customer.versionHistory.unchanged',
  'crm.entities.customer.versionHistory.viewMore',
  'crm.entities.customer.versionHistory.field.code',
  'crm.entities.customer.fields.code'
)
AND t.deleted_at IS NULL
ON CONFLICT ("key","language") WHERE "deleted_at" IS NULL DO NOTHING;

-- ─── en-GB ─────────────────────────────────────────────────────────────────
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  -- customer_type
  ('crm.entities.customer_type.title','en-GB','Customer Types','initial-setup','initial-setup'),
  ('crm.entities.customer_type.singular','en-GB','Customer Type','initial-setup','initial-setup'),
  ('crm.entities.customer_type.plural','en-GB','Customer Types','initial-setup','initial-setup'),
  ('crm.entities.customer_type.new.title','en-GB','New Customer Type','initial-setup','initial-setup'),
  ('crm.entities.customer_type.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.customer_type.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.customer_types.nav','en-GB','Customer Types','initial-setup','initial-setup'),
  -- company_dimension
  ('crm.entities.company_dimension.title','en-GB','Company Dimensions','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.singular','en-GB','Company Dimension','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.plural','en-GB','Company Dimensions','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.new.title','en-GB','New Company Dimension','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.min_size','en-GB','Min size','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.max_size','en-GB','Max size','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.company_dimensions.nav','en-GB','Company Dimensions','initial-setup','initial-setup'),
  -- legal_form
  ('crm.entities.legal_form.title','en-GB','Legal Forms','initial-setup','initial-setup'),
  ('crm.entities.legal_form.singular','en-GB','Legal Form','initial-setup','initial-setup'),
  ('crm.entities.legal_form.plural','en-GB','Legal Forms','initial-setup','initial-setup'),
  ('crm.entities.legal_form.new.title','en-GB','New Legal Form','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.country','en-GB','Country','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.elf_code','en-GB','ELF code','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.name_local','en-GB','Local name','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.name_transliterated','en-GB','Transliterated name','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.abbreviation','en-GB','Abbreviation','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.status','en-GB','Status','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.entities.legal_form.status.ACTV','en-GB','Active','initial-setup','initial-setup'),
  ('crm.entities.legal_form.status.INAC','en-GB','Inactive','initial-setup','initial-setup'),
  ('crm.legal_forms.nav','en-GB','Legal Forms','initial-setup','initial-setup'),
  -- local_address_type
  ('crm.entities.local_address_type.title','en-GB','Address Types','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.singular','en-GB','Address Type','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.plural','en-GB','Address Types','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.new.title','en-GB','New Address Type','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.local_address_types.nav','en-GB','Address Types','initial-setup','initial-setup'),
  -- qualification
  ('crm.entities.qualification.title','en-GB','Qualifications','initial-setup','initial-setup'),
  ('crm.entities.qualification.singular','en-GB','Qualification','initial-setup','initial-setup'),
  ('crm.entities.qualification.plural','en-GB','Qualifications','initial-setup','initial-setup'),
  ('crm.entities.qualification.new.title','en-GB','New Qualification','initial-setup','initial-setup'),
  ('crm.entities.qualification.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.qualification.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.qualifications.nav','en-GB','Qualifications','initial-setup','initial-setup'),
  -- marketing_qualification
  ('crm.entities.marketing_qualification.title','en-GB','Marketing Qualifications','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.singular','en-GB','Marketing Qualification','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.plural','en-GB','Marketing Qualifications','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.new.title','en-GB','New Marketing Qualification','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.marketing_qualifications.nav','en-GB','Marketing Qualifications','initial-setup','initial-setup'),
  -- contact_type
  ('crm.entities.contact_type.title','en-GB','Contact Types','initial-setup','initial-setup'),
  ('crm.entities.contact_type.singular','en-GB','Contact Type','initial-setup','initial-setup'),
  ('crm.entities.contact_type.plural','en-GB','Contact Types','initial-setup','initial-setup'),
  ('crm.entities.contact_type.new.title','en-GB','New Contact Type','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.value_kind','en-GB','Value kind','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.email','en-GB','Email','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.phone','en-GB','Phone','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.text','en-GB','Text','initial-setup','initial-setup'),
  ('crm.contact_types.nav','en-GB','Contact Types','initial-setup','initial-setup'),
  -- account_kind
  ('crm.entities.account_kind.title','en-GB','Account Types','initial-setup','initial-setup'),
  ('crm.entities.account_kind.singular','en-GB','Account Type','initial-setup','initial-setup'),
  ('crm.entities.account_kind.plural','en-GB','Account Types','initial-setup','initial-setup'),
  ('crm.entities.account_kind.new.title','en-GB','New Account Type','initial-setup','initial-setup'),
  ('crm.entities.account_kind.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.account_kind.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.account_kinds.nav','en-GB','Account Types','initial-setup','initial-setup'),
  -- customer_link_type
  ('crm.entities.customer_link_type.title','en-GB','Link Types','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.singular','en-GB','Link Type','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.plural','en-GB','Link Types','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.new.title','en-GB','New Link Type','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.customer_link_types.nav','en-GB','Link Types','initial-setup','initial-setup'),
  -- consent_type
  ('crm.entities.consent_type.title','en-GB','Consent Types','initial-setup','initial-setup'),
  ('crm.entities.consent_type.singular','en-GB','Consent Type','initial-setup','initial-setup'),
  ('crm.entities.consent_type.plural','en-GB','Consent Types','initial-setup','initial-setup'),
  ('crm.entities.consent_type.new.title','en-GB','New Consent Type','initial-setup','initial-setup'),
  ('crm.entities.consent_type.fields.label_key','en-GB','Label key','initial-setup','initial-setup'),
  ('crm.entities.consent_type.fields.sort','en-GB','Sort','initial-setup','initial-setup'),
  ('crm.consent_types.nav','en-GB','Consent Types','initial-setup','initial-setup'),
  -- local_address
  ('crm.entities.local_address.title','en-GB','Addresses','initial-setup','initial-setup'),
  ('crm.entities.local_address.singular','en-GB','Address','initial-setup','initial-setup'),
  ('crm.entities.local_address.plural','en-GB','Addresses','initial-setup','initial-setup'),
  ('crm.entities.local_address.new.title','en-GB','New Address','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.customer_id','en-GB','Customer','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.type_uuid','en-GB','Type','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street','en-GB','Street','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.civic','en-GB','No.','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.postal_code','en-GB','Postal code','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.city','en-GB','City','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.province','en-GB','Province','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.country','en-GB','Country','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.lat','en-GB','Latitude','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.lng','en-GB','Longitude','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.poi_name','en-GB','POI name','initial-setup','initial-setup'),
  ('crm.local_addresses.nav','en-GB','Addresses','initial-setup','initial-setup'),
  -- customer_account
  ('crm.entities.customer_account.title','en-GB','Customer Accounts','initial-setup','initial-setup'),
  ('crm.entities.customer_account.singular','en-GB','Customer Account','initial-setup','initial-setup'),
  ('crm.entities.customer_account.plural','en-GB','Customer Accounts','initial-setup','initial-setup'),
  ('crm.entities.customer_account.new.title','en-GB','New Customer Account','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.customer_id','en-GB','Customer','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.kind_uuid','en-GB','Type','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.company_name','en-GB','Company name','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.legal_form_uuid','en-GB','Legal form','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.country','en-GB','Country','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.local_address_id','en-GB','Address','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.contact_id','en-GB','Contact','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.is_default','en-GB','Default','initial-setup','initial-setup'),
  ('crm.customer_accounts.nav','en-GB','Customer Accounts','initial-setup','initial-setup'),
  -- customer_contact
  ('crm.entities.customer_contact.title','en-GB','Contacts','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.singular','en-GB','Contact','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.plural','en-GB','Contacts','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.new.title','en-GB','New Contact','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.customer_id','en-GB','Customer','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.type_uuid','en-GB','Type','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.value','en-GB','Value','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.is_default','en-GB','Default','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.label','en-GB','Label','initial-setup','initial-setup'),
  ('crm.customer_contacts.nav','en-GB','Contacts','initial-setup','initial-setup'),
  -- customer_link
  ('crm.entities.customer_link.title','en-GB','Customer Links','initial-setup','initial-setup'),
  ('crm.entities.customer_link.singular','en-GB','Customer Link','initial-setup','initial-setup'),
  ('crm.entities.customer_link.plural','en-GB','Customer Links','initial-setup','initial-setup'),
  ('crm.entities.customer_link.new.title','en-GB','New Customer Link','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.parent_customer_id','en-GB','Parent customer','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.child_customer_id','en-GB','Child customer','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.type_uuid','en-GB','Type','initial-setup','initial-setup'),
  ('crm.customer_links.nav','en-GB','Customer Links','initial-setup','initial-setup'),
  -- customer_consent
  ('crm.entities.customer_consent.title','en-GB','Consents','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.singular','en-GB','Consent','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.plural','en-GB','Consents','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.new.title','en-GB','New Consent','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.customer_id','en-GB','Customer','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.type_uuid','en-GB','Type','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.doc_version','en-GB','Doc version','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.granted_at','en-GB','Granted at','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.revoked_at','en-GB','Revoked at','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.channel','en-GB','Channel','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.ip','en-GB','IP','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.user_agent','en-GB','User agent','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.seal','en-GB','Seal','initial-setup','initial-setup'),
  ('crm.customer_consents.nav','en-GB','Consents','initial-setup','initial-setup'),
  -- customer new fields
  ('crm.entities.customer.fields.customer_type_uuid','en-GB','Customer type','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.qualification_uuid','en-GB','Qualification','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.marketing_qualification_uuid','en-GB','Marketing qualification','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.company_dimension_uuid','en-GB','Company dimension','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE "deleted_at" IS NULL DO NOTHING;

-- ─── it-IT ─────────────────────────────────────────────────────────────────
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  -- customer_type
  ('crm.entities.customer_type.title','it-IT','Tipi cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_type.singular','it-IT','Tipo cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_type.plural','it-IT','Tipi cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_type.new.title','it-IT','Nuovo tipo cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_type.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.customer_type.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.customer_types.nav','it-IT','Tipi cliente','initial-setup','initial-setup'),
  -- company_dimension
  ('crm.entities.company_dimension.title','it-IT','Dimensioni aziendali','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.singular','it-IT','Dimensione aziendale','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.plural','it-IT','Dimensioni aziendali','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.new.title','it-IT','Nuova dimensione aziendale','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.min_size','it-IT','Dimensione min','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.max_size','it-IT','Dimensione max','initial-setup','initial-setup'),
  ('crm.entities.company_dimension.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.company_dimensions.nav','it-IT','Dimensioni aziendali','initial-setup','initial-setup'),
  -- legal_form
  ('crm.entities.legal_form.title','it-IT','Forme giuridiche','initial-setup','initial-setup'),
  ('crm.entities.legal_form.singular','it-IT','Forma giuridica','initial-setup','initial-setup'),
  ('crm.entities.legal_form.plural','it-IT','Forme giuridiche','initial-setup','initial-setup'),
  ('crm.entities.legal_form.new.title','it-IT','Nuova forma giuridica','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.country','it-IT','Paese','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.elf_code','it-IT','Codice ELF','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.name_local','it-IT','Nome locale','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.name_transliterated','it-IT','Nome traslitterato','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.abbreviation','it-IT','Abbreviazione','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.status','it-IT','Stato','initial-setup','initial-setup'),
  ('crm.entities.legal_form.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.entities.legal_form.status.ACTV','it-IT','Attiva','initial-setup','initial-setup'),
  ('crm.entities.legal_form.status.INAC','it-IT','Inattiva','initial-setup','initial-setup'),
  ('crm.legal_forms.nav','it-IT','Forme giuridiche','initial-setup','initial-setup'),
  -- local_address_type
  ('crm.entities.local_address_type.title','it-IT','Tipi indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.singular','it-IT','Tipo indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.plural','it-IT','Tipi indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.new.title','it-IT','Nuovo tipo indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.local_address_type.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.local_address_types.nav','it-IT','Tipi indirizzo','initial-setup','initial-setup'),
  -- qualification
  ('crm.entities.qualification.title','it-IT','Qualifiche','initial-setup','initial-setup'),
  ('crm.entities.qualification.singular','it-IT','Qualifica','initial-setup','initial-setup'),
  ('crm.entities.qualification.plural','it-IT','Qualifiche','initial-setup','initial-setup'),
  ('crm.entities.qualification.new.title','it-IT','Nuova qualifica','initial-setup','initial-setup'),
  ('crm.entities.qualification.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.qualification.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.qualifications.nav','it-IT','Qualifiche','initial-setup','initial-setup'),
  -- marketing_qualification
  ('crm.entities.marketing_qualification.title','it-IT','Qualifiche marketing','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.singular','it-IT','Qualifica marketing','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.plural','it-IT','Qualifiche marketing','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.new.title','it-IT','Nuova qualifica marketing','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.marketing_qualification.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.marketing_qualifications.nav','it-IT','Qualifiche marketing','initial-setup','initial-setup'),
  -- contact_type
  ('crm.entities.contact_type.title','it-IT','Tipi contatto','initial-setup','initial-setup'),
  ('crm.entities.contact_type.singular','it-IT','Tipo contatto','initial-setup','initial-setup'),
  ('crm.entities.contact_type.plural','it-IT','Tipi contatto','initial-setup','initial-setup'),
  ('crm.entities.contact_type.new.title','it-IT','Nuovo tipo contatto','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.value_kind','it-IT','Tipo valore','initial-setup','initial-setup'),
  ('crm.entities.contact_type.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.email','it-IT','Email','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.phone','it-IT','Telefono','initial-setup','initial-setup'),
  ('crm.entities.contact_type.value_kind.text','it-IT','Testo','initial-setup','initial-setup'),
  ('crm.contact_types.nav','it-IT','Tipi contatto','initial-setup','initial-setup'),
  -- account_kind
  ('crm.entities.account_kind.title','it-IT','Tipi account','initial-setup','initial-setup'),
  ('crm.entities.account_kind.singular','it-IT','Tipo account','initial-setup','initial-setup'),
  ('crm.entities.account_kind.plural','it-IT','Tipi account','initial-setup','initial-setup'),
  ('crm.entities.account_kind.new.title','it-IT','Nuovo tipo account','initial-setup','initial-setup'),
  ('crm.entities.account_kind.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.account_kind.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.account_kinds.nav','it-IT','Tipi account','initial-setup','initial-setup'),
  -- customer_link_type
  ('crm.entities.customer_link_type.title','it-IT','Tipi collegamento','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.singular','it-IT','Tipo collegamento','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.plural','it-IT','Tipi collegamento','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.new.title','it-IT','Nuovo tipo collegamento','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.customer_link_type.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.customer_link_types.nav','it-IT','Tipi collegamento','initial-setup','initial-setup'),
  -- consent_type
  ('crm.entities.consent_type.title','it-IT','Tipi consenso','initial-setup','initial-setup'),
  ('crm.entities.consent_type.singular','it-IT','Tipo consenso','initial-setup','initial-setup'),
  ('crm.entities.consent_type.plural','it-IT','Tipi consenso','initial-setup','initial-setup'),
  ('crm.entities.consent_type.new.title','it-IT','Nuovo tipo consenso','initial-setup','initial-setup'),
  ('crm.entities.consent_type.fields.label_key','it-IT','Chiave etichetta','initial-setup','initial-setup'),
  ('crm.entities.consent_type.fields.sort','it-IT','Ordine','initial-setup','initial-setup'),
  ('crm.consent_types.nav','it-IT','Tipi consenso','initial-setup','initial-setup'),
  -- local_address
  ('crm.entities.local_address.title','it-IT','Indirizzi','initial-setup','initial-setup'),
  ('crm.entities.local_address.singular','it-IT','Indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address.plural','it-IT','Indirizzi','initial-setup','initial-setup'),
  ('crm.entities.local_address.new.title','it-IT','Nuovo indirizzo','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.customer_id','it-IT','Cliente','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.type_uuid','it-IT','Tipo','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street','it-IT','Via','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.civic','it-IT','N°','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.postal_code','it-IT','CAP','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.city','it-IT','Città','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.province','it-IT','Provincia','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.country','it-IT','Paese','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.lat','it-IT','Latitudine','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.lng','it-IT','Longitudine','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.poi_name','it-IT','Nome POI','initial-setup','initial-setup'),
  ('crm.local_addresses.nav','it-IT','Indirizzi','initial-setup','initial-setup'),
  -- customer_account
  ('crm.entities.customer_account.title','it-IT','Account cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_account.singular','it-IT','Account cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_account.plural','it-IT','Account cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_account.new.title','it-IT','Nuovo account cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.customer_id','it-IT','Cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.kind_uuid','it-IT','Tipo','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.company_name','it-IT','Ragione sociale','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.legal_form_uuid','it-IT','Forma giuridica','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.country','it-IT','Paese','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.local_address_id','it-IT','Indirizzo','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.contact_id','it-IT','Contatto','initial-setup','initial-setup'),
  ('crm.entities.customer_account.fields.is_default','it-IT','Predefinito','initial-setup','initial-setup'),
  ('crm.customer_accounts.nav','it-IT','Account cliente','initial-setup','initial-setup'),
  -- customer_contact
  ('crm.entities.customer_contact.title','it-IT','Contatti','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.singular','it-IT','Contatto','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.plural','it-IT','Contatti','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.new.title','it-IT','Nuovo contatto','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.customer_id','it-IT','Cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.type_uuid','it-IT','Tipo','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.value','it-IT','Valore','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.is_default','it-IT','Predefinito','initial-setup','initial-setup'),
  ('crm.entities.customer_contact.fields.label','it-IT','Etichetta','initial-setup','initial-setup'),
  ('crm.customer_contacts.nav','it-IT','Contatti','initial-setup','initial-setup'),
  -- customer_link
  ('crm.entities.customer_link.title','it-IT','Collegamenti cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_link.singular','it-IT','Collegamento cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_link.plural','it-IT','Collegamenti cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_link.new.title','it-IT','Nuovo collegamento cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.parent_customer_id','it-IT','Cliente padre','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.child_customer_id','it-IT','Cliente figlio','initial-setup','initial-setup'),
  ('crm.entities.customer_link.fields.type_uuid','it-IT','Tipo','initial-setup','initial-setup'),
  ('crm.customer_links.nav','it-IT','Collegamenti cliente','initial-setup','initial-setup'),
  -- customer_consent
  ('crm.entities.customer_consent.title','it-IT','Consensi','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.singular','it-IT','Consenso','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.plural','it-IT','Consensi','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.new.title','it-IT','Nuovo consenso','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.customer_id','it-IT','Cliente','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.type_uuid','it-IT','Tipo','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.doc_version','it-IT','Versione doc','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.granted_at','it-IT','Concesso il','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.revoked_at','it-IT','Revocato il','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.channel','it-IT','Canale','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.ip','it-IT','IP','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.user_agent','it-IT','User agent','initial-setup','initial-setup'),
  ('crm.entities.customer_consent.fields.seal','it-IT','Sigillo','initial-setup','initial-setup'),
  ('crm.customer_consents.nav','it-IT','Consensi','initial-setup','initial-setup'),
  -- customer new fields
  ('crm.entities.customer.fields.customer_type_uuid','it-IT','Tipo cliente','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.qualification_uuid','it-IT','Qualifica','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.marketing_qualification_uuid','it-IT','Qualifica marketing','initial-setup','initial-setup'),
  ('crm.entities.customer.fields.company_dimension_uuid','it-IT','Dimensione aziendale','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE "deleted_at" IS NULL DO NOTHING;

-- ─── en-US: clone every en-GB row written above ─────────────────────────────
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by")
SELECT t.key, 'en-US', t.value, 'initial-setup', 'initial-setup'
FROM "crm"."translations" t
WHERE t.language = 'en-GB'
  AND (
    t.key LIKE 'crm.entities.customer\_type.%'
    OR t.key LIKE 'crm.entities.company\_dimension.%'
    OR t.key LIKE 'crm.entities.legal\_form.%'
    OR t.key LIKE 'crm.entities.local\_address%.%'
    OR t.key LIKE 'crm.entities.qualification.%'
    OR t.key LIKE 'crm.entities.marketing\_qualification.%'
    OR t.key LIKE 'crm.entities.contact\_type.%'
    OR t.key LIKE 'crm.entities.account\_kind.%'
    OR t.key LIKE 'crm.entities.customer\_link%.%'
    OR t.key LIKE 'crm.entities.consent\_type.%'
    OR t.key LIKE 'crm.entities.customer\_account.%'
    OR t.key LIKE 'crm.entities.customer\_contact.%'
    OR t.key LIKE 'crm.entities.customer\_consent.%'
    OR t.key IN (
      'crm.entities.customer.fields.customer_type_uuid',
      'crm.entities.customer.fields.qualification_uuid',
      'crm.entities.customer.fields.marketing_qualification_uuid',
      'crm.entities.customer.fields.company_dimension_uuid'
    )
    OR t.key IN (
      'crm.customer_types.nav','crm.company_dimensions.nav','crm.legal_forms.nav',
      'crm.local_address_types.nav','crm.qualifications.nav','crm.marketing_qualifications.nav',
      'crm.contact_types.nav','crm.account_kinds.nav','crm.customer_link_types.nav',
      'crm.consent_types.nav','crm.local_addresses.nav','crm.customer_accounts.nav',
      'crm.customer_contacts.nav','crm.customer_links.nav','crm.customer_consents.nav'
    )
  )
  AND t.deleted_at IS NULL
ON CONFLICT ("key","language") WHERE "deleted_at" IS NULL DO NOTHING;

COMMIT;

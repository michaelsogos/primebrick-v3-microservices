-- 20261107180000 — seed crm dictionary tables (vocabulary = TABLES, user-editable).
-- Row labels are label_key i18n keys (crm.entities.<entity>.rows.<code>) —
-- translations land in the companion translations patch.

BEGIN;

INSERT INTO "crm"."customer_types" ("code", "label_key", "sort") VALUES
  ('private', 'crm.entities.customer_type.rows.private', 10),
  ('company', 'crm.entities.customer_type.rows.company', 20),
  ('pa',      'crm.entities.customer_type.rows.pa',      30),
  ('charity', 'crm.entities.customer_type.rows.charity', 40)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."company_dimensions" ("code", "label_key", "min_size", "max_size", "sort") VALUES
  ('range_1_10',    'crm.entities.company_dimension.rows.range_1_10',    1,  10,  10),
  ('range_11_50',   'crm.entities.company_dimension.rows.range_11_50',   11, 50,  20),
  ('range_51_500',  'crm.entities.company_dimension.rows.range_51_500',  51, 500, 30),
  ('range_500_plus','crm.entities.company_dimension.rows.range_500_plus',500, NULL,40)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."local_address_types" ("code", "label_key", "sort") VALUES
  ('legal',          'crm.entities.local_address_type.rows.legal',          10),
  ('administration', 'crm.entities.local_address_type.rows.administration', 20),
  ('operational',    'crm.entities.local_address_type.rows.operational',    30),
  ('billing',        'crm.entities.local_address_type.rows.billing',        40),
  ('shipping',       'crm.entities.local_address_type.rows.shipping',       50)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."qualifications" ("code", "label_key", "sort") VALUES
  ('lead',        'crm.entities.qualification.rows.lead',        10),
  ('prospect',    'crm.entities.qualification.rows.prospect',    20),
  ('customer',    'crm.entities.qualification.rows.customer',    30),
  ('lost',        'crm.entities.qualification.rows.lost',        90),
  ('unqualified', 'crm.entities.qualification.rows.unqualified', 99)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."marketing_qualifications" ("code", "label_key", "sort") VALUES
  ('mql', 'crm.entities.marketing_qualification.rows.mql', 10),
  ('sal', 'crm.entities.marketing_qualification.rows.sal', 20),
  ('sql', 'crm.entities.marketing_qualification.rows.sql', 30),
  ('pql', 'crm.entities.marketing_qualification.rows.pql', 40)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."contact_types" ("code", "label_key", "value_kind", "sort") VALUES
  ('email', 'crm.entities.contact_type.rows.email', 'email', 10),
  ('voice', 'crm.entities.contact_type.rows.voice', 'phone', 20),
  ('sms',   'crm.entities.contact_type.rows.sms',   'phone', 30)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."account_kinds" ("code", "label_key", "sort") VALUES
  ('invoice', 'crm.entities.account_kind.rows.invoice', 10),
  ('legal',   'crm.entities.account_kind.rows.legal',   20)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."customer_link_types" ("code", "label_key", "sort") VALUES
  ('subsidiary', 'crm.entities.customer_link_type.rows.subsidiary', 10),
  ('employee',   'crm.entities.customer_link_type.rows.employee',   20),
  ('consultant', 'crm.entities.customer_link_type.rows.consultant', 30),
  ('referent',   'crm.entities.customer_link_type.rows.referent',   40)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "crm"."consent_types" ("code", "label_key", "sort") VALUES
  ('privacy_policy', 'crm.entities.consent_type.rows.privacy_policy', 10),
  ('marketing',      'crm.entities.consent_type.rows.marketing',      20),
  ('profiling',      'crm.entities.consent_type.rows.profiling',      30),
  ('third_party',    'crm.entities.consent_type.rows.third_party',    40)
ON CONFLICT ("code") DO NOTHING;

COMMIT;

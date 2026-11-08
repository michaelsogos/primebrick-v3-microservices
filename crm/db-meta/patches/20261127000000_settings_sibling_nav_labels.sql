-- 20261127000000 — crm.translations for the "Impostazioni" sibling node
-- and the customer_types dict page nav labels (`crm.settings.nav.*`),
-- all 7 supported locales. Insert-once via ON CONFLICT DO NOTHING.

BEGIN;

-- de-DE
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','de-DE','Einstellungen','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','de-DE','Kundentypen','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- en-GB
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','en-GB','Settings','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','en-GB','Customer types','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- en-US
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','en-US','Settings','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','en-US','Customer types','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- es-ES
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','es-ES','Configuración','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','es-ES','Tipos de cliente','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- fr-FR
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','fr-FR','Paramètres','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','fr-FR','Types de client','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- it-IT
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','it-IT','Impostazioni','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','it-IT','Tipi cliente','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

-- pt-PT
INSERT INTO "crm"."translations" ("key","language","value","created_by","updated_by") VALUES
  ('crm.settings.nav.label','pt-PT','Definições','initial-setup','initial-setup'),
  ('crm.settings.nav.customer_types','pt-PT','Tipos de cliente','initial-setup','initial-setup')
ON CONFLICT ("key","language") WHERE deleted_at IS NULL DO NOTHING;

COMMIT;

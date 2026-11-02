-- Customer `preferred_locale` — BCP-47 communication locale (e.g. it-IT,
-- en-US). User-configured on the customer row; rides the CRM event
-- customer snapshot so rule payload maps can resolve `languageIso`
-- (e.g. `$.customer.preferred_locale`) for localizable callables.

ALTER TABLE crm.customers
  ADD COLUMN IF NOT EXISTS preferred_locale varchar(35) NULL;

INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'de-DE', 'Bevorzugte Sprache', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'en-GB', 'Preferred locale', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'en-US', 'Preferred locale', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'es-ES', 'Idioma preferido', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'fr-FR', 'Langue préférée', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'it-IT', 'Lingua preferita', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.entities.customer.fields.preferred_locale', 'pt-PT', 'Idioma preferido', now(), 'migration-preferred-locale', now(), 'migration-preferred-locale', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

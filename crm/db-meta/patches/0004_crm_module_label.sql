-- crm.module.name — the module's OWN display-name key, referenced by
-- service_registry.label_key. Single source for every UI surface
-- (breadcrumbs, app launcher, module menus): they render
-- resolveModuleLabel(module) = t(module.label_key) with the raw
-- registry `name` as fallback. "CRM" is a proper noun — identical
-- in all 7 languages.

INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'de-DE', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'en-GB', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'en-US', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'es-ES', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'fr-FR', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'it-IT', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO crm.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('crm.module.name', 'pt-PT', 'CRM', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

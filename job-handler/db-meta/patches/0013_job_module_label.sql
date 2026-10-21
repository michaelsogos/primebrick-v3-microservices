-- job.module.name — the module's OWN display-name key, referenced by
-- service_registry.label_key. Single source for every UI surface
-- (breadcrumbs, app launcher, module menus): they render
-- resolveModuleLabel(module) = t(module.label_key) with the raw
-- registry `name` as fallback. "Job Handler" is a product name —
-- identical in all 7 languages.

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'de-DE', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'en-GB', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'en-US', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'es-ES', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'fr-FR', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'it-IT', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.module.name', 'pt-PT', 'Job Handler', now(), 'migration-module-label', now(), 'migration-module-label', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

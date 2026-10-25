-- End-user display names — module + leaf labels must be meaningful names,
-- not pedantic echoes of the technical code ("ai"). The code stays the
-- technical identifier (routes, schemas, access keys); the NAME is the
-- product surface the user reads. All 7 UI languages updated in place.

UPDATE ai.translations SET value = 'Gestore degli Assistenti AI', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'AI Assistants Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'AI Assistants Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Gestionnaire des assistants IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Gestor de asistentes de IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Verwaltung der KI-Assistenten', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Gestor de assistentes de IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.module.name' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE ai.translations SET value = 'Gestione Modelli AI', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'AI Models', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'AI Models', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Modèles IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Modelos de IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'KI-Modelle', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Modelos de IA', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE ai.translations SET value = 'Indicizzazione dei Documenti', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Document Indexing', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Document Indexing', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Indexation des documents', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Indexación de documentos', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Dokumentenindizierung', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE ai.translations SET value = 'Indexação de documentos', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'ai.nav.docs_index' AND language = 'pt-PT' AND deleted_at IS NULL;

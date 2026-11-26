-- Primebrick: rename translation-key surface labels to the user-meaning
-- convention — the field is named after the translated content the user
-- gets, never the stored key format
-- (docs/ai/copy-tone-of-voice.md "Concrete jargon cases").
-- Per-key casing preserved as shipped.

-- ai_model.fields.label_key — "Label Key" → "Label Translation"
UPDATE ai.translations SET value = 'Label Translation', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language IN ('en-GB', 'en-US');
UPDATE ai.translations SET value = 'Traduzione Etichetta', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language = 'it-IT';
UPDATE ai.translations SET value = 'Traduction d''Étiquette', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language = 'fr-FR';
UPDATE ai.translations SET value = 'Traducción de Etiqueta', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language = 'es-ES';
UPDATE ai.translations SET value = 'Bezeichnungsübersetzung', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language = 'de-DE';
UPDATE ai.translations SET value = 'Tradução de Etiqueta', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'ai.entities.ai_model.fields.label_key' AND language = 'pt-PT';

-- ai_model.fields.description_key + ai_cerebellum.fields.description_key
UPDATE ai.translations SET value = 'Description Translation', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language IN ('en-GB', 'en-US');
UPDATE ai.translations SET value = 'Traduzione Descrizione', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language = 'it-IT';
UPDATE ai.translations SET value = 'Traduction de Description', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language = 'fr-FR';
UPDATE ai.translations SET value = 'Traducción de Descripción', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language = 'es-ES';
UPDATE ai.translations SET value = 'Beschreibungsübersetzung', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language = 'de-DE';
UPDATE ai.translations SET value = 'Tradução de Descrição', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN ('ai.entities.ai_model.fields.description_key', 'ai.entities.ai_cerebellum.fields.description_key') AND language = 'pt-PT';

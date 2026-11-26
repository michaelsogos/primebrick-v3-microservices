-- Primebrick: sequence `start` column label — the governed vocabulary is
-- "Start" (short), not "Initial Value"/"Valore iniziale". Data-only
-- patch: translation VALUES for the existing key, all 7 languages.

UPDATE crm.translations SET value = 'Start', updated_at = now(), updated_by = 'migration-sequence-start-label', version = version + 1
WHERE key = 'crm.entities.sequence.fields.start' AND language IN ('en-GB', 'en-US', 'de-DE');
UPDATE crm.translations SET value = 'Inizio', updated_at = now(), updated_by = 'migration-sequence-start-label', version = version + 1
WHERE key = 'crm.entities.sequence.fields.start' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Début', updated_at = now(), updated_by = 'migration-sequence-start-label', version = version + 1
WHERE key = 'crm.entities.sequence.fields.start' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Inicio', updated_at = now(), updated_by = 'migration-sequence-start-label', version = version + 1
WHERE key = 'crm.entities.sequence.fields.start' AND language IN ('es-ES', 'pt-PT');

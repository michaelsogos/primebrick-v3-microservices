-- Primebrick: sequence registry labels after the code→name uuid-identity
-- change. `fields.code` is renamed to `fields.name` (key rename keeps the
-- row identity); column labels updated to the governed vocabulary —
-- step="Increment", start="Initial Value", value_actual="Current",
-- value_next="Next", emitted_actual="Current Sequence",
-- emitted_next="Next Sequence". `fields.label_key` is removed (column
-- dropped).

UPDATE crm.translations SET key = 'crm.entities.sequence.fields.name' WHERE key = 'crm.entities.sequence.fields.code';
DELETE FROM crm.translations WHERE key = 'crm.entities.sequence.fields.label_key';

UPDATE crm.translations SET value = 'Name', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.name' AND language IN ('en-GB', 'en-US', 'de-DE');
UPDATE crm.translations SET value = 'Nome', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.name' AND language IN ('it-IT', 'pt-PT');
UPDATE crm.translations SET value = 'Nom', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.name' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Nombre', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.name' AND language = 'es-ES';

UPDATE crm.translations SET value = 'Increment', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.step' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Incremento', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.step' AND language IN ('it-IT', 'es-ES', 'pt-PT');
UPDATE crm.translations SET value = 'Incrément', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.step' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Inkrement', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.step' AND language = 'de-DE';

UPDATE crm.translations SET value = 'Initial Value', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.start' AND language IN ('en-GB', 'en-US');

UPDATE crm.translations SET value = 'Current', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Attuale', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Actuel', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Actual', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language = 'es-ES';
UPDATE crm.translations SET value = 'Aktuell', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language = 'de-DE';
UPDATE crm.translations SET value = 'Atual', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_actual' AND language = 'pt-PT';

UPDATE crm.translations SET value = 'Next', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_next' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Prossimo', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_next' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Prochain', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_next' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Próximo', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_next' AND language IN ('es-ES', 'pt-PT');
UPDATE crm.translations SET value = 'Nächster', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.value_next' AND language = 'de-DE';

UPDATE crm.translations SET value = 'Current Sequence', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Sequenza Attuale', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Séquence actuelle', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Secuencia actual', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language = 'es-ES';
UPDATE crm.translations SET value = 'Aktuelle Sequenz', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language = 'de-DE';
UPDATE crm.translations SET value = 'Sequência atual', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_actual' AND language = 'pt-PT';

UPDATE crm.translations SET value = 'Next Sequence', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Prossima Sequenza', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Prochaine séquence', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Próxima secuencia', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language = 'es-ES';
UPDATE crm.translations SET value = 'Nächste Sequenz', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language = 'de-DE';
UPDATE crm.translations SET value = 'Próxima sequência', updated_at = now(), updated_by = 'migration-sequence-name-i18n', version = version + 1
WHERE key = 'crm.entities.sequence.fields.emitted_next' AND language = 'pt-PT';

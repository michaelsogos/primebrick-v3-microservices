-- Primebrick: rename every translation-key surface label to the
-- user-meaning convention — the field is named after the translated
-- content the user gets, never the stored key format
-- (docs/ai/copy-tone-of-voice.md "Concrete jargon cases").
-- Per-key casing preserved as shipped.

-- fields.label_key — "Label key" → "Label translation"
UPDATE crm.translations SET value = 'Label translation', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN (
  'crm.entities.account_kind.fields.label_key',
  'crm.entities.company_dimension.fields.label_key',
  'crm.entities.consent_type.fields.label_key',
  'crm.entities.contact_type.fields.label_key',
  'crm.entities.customer_link_type.fields.label_key',
  'crm.entities.customer_type.fields.label_key',
  'crm.entities.local_address_type.fields.label_key',
  'crm.entities.marketing_qualification.fields.label_key',
  'crm.entities.qualification.fields.label_key'
) AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Traduzione etichetta', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key IN (
  'crm.entities.account_kind.fields.label_key',
  'crm.entities.company_dimension.fields.label_key',
  'crm.entities.consent_type.fields.label_key',
  'crm.entities.contact_type.fields.label_key',
  'crm.entities.customer_link_type.fields.label_key',
  'crm.entities.customer_type.fields.label_key',
  'crm.entities.local_address_type.fields.label_key',
  'crm.entities.marketing_qualification.fields.label_key',
  'crm.entities.qualification.fields.label_key'
) AND language = 'it-IT';

-- customer_link_type.fields.inverse_label_key — "Inverse label key" → "Inverse label translation"
UPDATE crm.translations SET value = 'Inverse label translation', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Traduzione etichetta inversa', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Traduction de l''étiquette inverse', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Traducción de etiqueta inversa', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language = 'es-ES';
UPDATE crm.translations SET value = 'Inverse Label-Übersetzung', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language = 'de-DE';
UPDATE crm.translations SET value = 'Tradução de etiqueta inversa', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.customer_link_type.fields.inverse_label_key' AND language = 'pt-PT';

-- sequence.fields.description_key — "Description key" → "Description translation"
UPDATE crm.translations SET value = 'Description translation', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language IN ('en-GB', 'en-US');
UPDATE crm.translations SET value = 'Traduzione descrizione', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language = 'it-IT';
UPDATE crm.translations SET value = 'Traduction de la description', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language = 'fr-FR';
UPDATE crm.translations SET value = 'Traducción de la descripción', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language = 'es-ES';
UPDATE crm.translations SET value = 'Beschreibungsübersetzung', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language = 'de-DE';
UPDATE crm.translations SET value = 'Tradução da descrição', updated_at = now(), updated_by = 'migration-i18n-key-labels', version = version + 1
WHERE key = 'crm.entities.sequence.fields.description_key' AND language = 'pt-PT';

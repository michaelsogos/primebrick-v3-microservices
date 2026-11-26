-- Primebrick: i18n — ai.settings sibling + ai-owned sequence surface keys.
--
-- The construction-mounted `settings` sibling (createMicroservice nav merge,
-- never authored) and the ai-side sequence surface cite
-- `ai.settings.nav.*` / `ai.entities.sequence.*` keys that were never
-- seeded — every render fell back to the raw key (module-ownership i18n
-- sweep: /system/ai/settings showed ai.settings.nav.sequences and
-- ai.entities.sequence.fields.* verbatim). Values are the canonical copy
-- verbatim from crm.translations — same sibling/entity contract — re-prefixed
-- crm. → ai., all languages preserved.

INSERT INTO ai.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'ai.' || substring(t.key from 5), t.language, t.value,
       now(), 'migration-i18n-ai-settings-surface', now(), 'migration-i18n-ai-settings-surface', 1
  FROM crm.translations t
 WHERE t.deleted_at IS NULL
   AND (t.key LIKE 'crm.settings.nav.%' OR t.key LIKE 'crm.entities.sequence.%')
   AND NOT EXISTS (
        SELECT 1 FROM ai.translations j
         WHERE j.key = 'ai.' || substring(t.key from 5)
           AND j.language = t.language
           AND j.deleted_at IS NULL);

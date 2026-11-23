-- Primebrick: i18n — emailsender.settings sibling + emailsender-owned sequence surface keys.
--
-- The construction-mounted `settings` sibling (createMicroservice nav merge,
-- never authored) and the emailsender-side sequence surface cite
-- `emailsender.settings.nav.*` / `emailsender.entities.sequence.*` keys that
-- were never seeded — every render fell back to the raw key (module-ownership
-- i18n sweep). Values are the canonical copy verbatim from crm.translations —
-- same sibling/entity contract — re-prefixed crm. → emailsender., all
-- languages preserved.

INSERT INTO emailsender.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'emailsender.' || substring(t.key from 5), t.language, t.value,
       now(), 'migration-i18n-emailsender-settings-surface', now(), 'migration-i18n-emailsender-settings-surface', 1
  FROM crm.translations t
 WHERE t.deleted_at IS NULL
   AND (t.key LIKE 'crm.settings.nav.%' OR t.key LIKE 'crm.entities.sequence.%')
   AND NOT EXISTS (
        SELECT 1 FROM emailsender.translations j
         WHERE j.key = 'emailsender.' || substring(t.key from 5)
           AND j.language = t.language
           AND j.deleted_at IS NULL);

-- Primebrick: i18n — job.settings sibling + job-owned sequence surface keys.
--
-- The construction-mounted `settings` sibling (createMicroservice nav merge,
-- never authored) and the job-side sequence surface cite
-- `job.settings.nav.*` / `job.entities.sequence.*` keys that were never
-- seeded — every render fell back to the raw key (module-ownership i18n
-- sweep: /system/job/settings showed job.settings.nav.sequences and
-- job.entities.sequence.fields.* verbatim). Values are the canonical copy
-- verbatim from crm.translations — same sibling/entity contract — re-prefixed
-- crm. → job., all languages preserved.

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'job.' || substring(t.key from 5), t.language, t.value,
       now(), 'migration-i18n-job-settings-surface', now(), 'migration-i18n-job-settings-surface', 1
  FROM crm.translations t
 WHERE t.deleted_at IS NULL
   AND (t.key LIKE 'crm.settings.nav.%' OR t.key LIKE 'crm.entities.sequence.%')
   AND NOT EXISTS (
        SELECT 1 FROM job.translations j
         WHERE j.key = 'job.' || substring(t.key from 5)
           AND j.language = t.language
           AND j.deleted_at IS NULL);

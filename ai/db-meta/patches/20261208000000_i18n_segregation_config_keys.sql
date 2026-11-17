-- Primebrick: i18n segregation — config label/description key ownership.
--
-- Every module-owned config row cited the platform namespace
-- `system.settings.config.*` — a module may not know another domain's
-- keys "by convention or otherwise". The cited translation rows are
-- copied into ai.translations under ai.settings.config.*
-- (all languages preserved) and ai.config_entries repoints
-- atomically in the same patch. BE-owned rows keep system.* — the
-- orphaned system copies are deleted by the matching be-v3 cleanup patch.

INSERT INTO ai.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'ai.' || substring(t.key from 8), t.language, t.value,
       now(), 'migration-i18n-segregation', now(), 'migration-i18n-segregation', 1
  FROM system.translations t
 WHERE t.deleted_at IS NULL
   AND t.key IN (
        SELECT c.label_key FROM ai.config_entries c
         WHERE c.deleted_at IS NULL AND c.label_key LIKE 'system.%'
        UNION
        SELECT c.description_key FROM ai.config_entries c
         WHERE c.deleted_at IS NULL AND c.description_key LIKE 'system.%'
       )
ON CONFLICT DO NOTHING;

UPDATE ai.config_entries
   SET label_key       = CASE WHEN label_key LIKE 'system.%'
                              THEN 'ai.' || substring(label_key from 8) ELSE label_key END,
       description_key = CASE WHEN description_key LIKE 'system.%'
                              THEN 'ai.' || substring(description_key from 8) ELSE description_key END,
       updated_at      = now(),
       updated_by      = 'migration-i18n-segregation',
       version         = version + 1
 WHERE deleted_at IS NULL
   AND (label_key LIKE 'system.%' OR description_key LIKE 'system.%');

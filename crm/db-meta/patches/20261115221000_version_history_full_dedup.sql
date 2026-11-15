-- Primebrick: retire the rest of the per-entity version_history.* seeds.
-- 20261115210000 removed the actions.* duplicates; the same seed dump also
-- copied the entire panel vocabulary (title/loading/empty/changed_from/
-- record_*/field.* etc.) into every entity's namespace — 2,322 live rows
-- across 16 entities. The FE reads only the generic
-- `system.entities.version_history.*` block (VersionHistoryPanel and the
-- shared title helper), so every entity-scoped copy is unaddressable dead
-- data and a parallel source of truth. Soft-deleting the remainder.

UPDATE crm.translations
SET deleted_at = now(), deleted_by = 'migration-vh-full-dedup', version = version + 1
WHERE key LIKE 'crm.entities.%.version_history.%'
  AND deleted_at IS NULL;

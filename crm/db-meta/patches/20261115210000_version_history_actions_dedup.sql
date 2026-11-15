-- Primebrick: retire per-entity version_history.actions.* seeds.
-- The audit action vocabulary is the closed platform enum AuditAction
-- (INSERT/UPDATE/SOFT_DELETE/HARD_DELETE/RESTORE/CLONE) — identical for
-- every entity, so the generic `system.entities.version_history.actions.*`
-- block is the one served truth. These per-entity copies were seed noise:
-- 784 live rows across 16 entities shadowing the same labels. The FE now
-- resolves the generic block only; the duplicates are soft-deleted so no
-- parallel source remains addressable.

UPDATE crm.translations
SET deleted_at = now(), deleted_by = 'migration-vh-actions-dedup', version = version + 1
WHERE key LIKE 'crm.entities.%.version_history.actions.%'
  AND deleted_at IS NULL;

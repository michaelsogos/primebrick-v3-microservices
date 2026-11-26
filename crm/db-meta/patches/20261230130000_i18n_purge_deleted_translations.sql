-- Primebrick: hard-delete soft-deleted tombstone rows left by migration
-- sweeps (crm.entities.* namespace cleanup, Nov 2026). Soft delete is the
-- USER-facing recycle bin (dict page deleted view + restore.single);
-- migration cleanup must not leave tombstones. The key_language unique
-- index is partial (WHERE deleted_at IS NULL) — no live row is touched.

DELETE FROM crm.translations WHERE deleted_at IS NOT NULL;

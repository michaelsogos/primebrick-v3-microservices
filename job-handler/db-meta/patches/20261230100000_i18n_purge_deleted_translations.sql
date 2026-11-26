-- Primebrick: hard-delete soft-deleted tombstone rows left by migration
-- sweeps. Soft delete is the USER-facing recycle bin (dict page deleted
-- view + restore.single); migration cleanup must not leave tombstones.
-- The key_language unique index is partial (WHERE deleted_at IS NULL).

DELETE FROM job.translations WHERE deleted_at IS NOT NULL;

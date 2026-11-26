-- Primebrick: hard-delete soft-deleted tombstone rows left by migration
-- sweeps (all 42 have live twins — keys re-created after delete).
-- Soft delete is the USER-facing recycle bin (dict page deleted view +
-- restore.single); migration cleanup must not leave tombstones.
-- The key_language unique index is partial (WHERE deleted_at IS NULL).

DELETE FROM emailsender.translations WHERE deleted_at IS NOT NULL;

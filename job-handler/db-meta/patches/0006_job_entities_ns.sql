-- Primebrick: Job module entity-label namespace ownership.
-- Patch 0005 seeded job entity labels under `system.entities.*` inside
-- `job.translations` on the (wrong) assumption that `system.entities.*` was a
-- platform-wide key namespace. The namespace boundary is schema-owned:
-- `job.translations` may only contain `job.*` keys, so job entity labels live
-- at `job.entities.<entity>.*` — `system.entities.*` belongs to BE-owned
-- entities in `system.translations`.
--
-- Renames all `system.entities.<entity>.*` rows to `job.entities.<entity>.*`
-- (49 keys x 7 languages). No `job.entities.*` keys exist yet — verified
-- before authoring — so the rename cannot collide on (key, language).

UPDATE job.translations
SET key = 'job.entities.' || substring(key from length('system.entities.') + 1),
    updated_by = 'migration-0006'
WHERE key LIKE 'system.entities.%'
  AND deleted_at IS NULL;

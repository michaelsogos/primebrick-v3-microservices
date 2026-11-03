-- 20261107150000 — subject anatomy fix in triggers_changed.desc.
-- The desc explains the subject vocabulary; the resource segment is now
-- `triggers`, not `rules` (the noun REPLACE pass correctly skipped the
-- backticked subject token — fix it explicitly).

BEGIN;

UPDATE job.translations
  SET value=replace(value,'`rules`','`triggers`'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.desc' AND deleted_at IS NULL;

COMMIT;

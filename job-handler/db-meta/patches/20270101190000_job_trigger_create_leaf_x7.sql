-- Primebrick: job_trigger create leaf label — the canonical derivation key
-- `job.job_triggers.nav.create` in all 7 languages at birth (never a phase 2).
-- Composition style mirrors the crm create leaves per language: exact string
-- per language, gender correct by construction, no runtime composition.

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT v.uuid, v.key, v.language, v.value, v.created_at, v.created_by, v.updated_at, v.updated_by, v.version
FROM (VALUES
  (uuidv7(), 'job.job_triggers.nav.create', 'en-GB', 'New Trigger', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'en-US', 'New Trigger', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'it-IT', 'Nuovo Attivatore', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'de-DE', 'Neuer Trigger', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'fr-FR', 'Nouveau déclencheur', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'es-ES', 'Nuevo trigger', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1),
  (uuidv7(), 'job.job_triggers.nav.create', 'pt-PT', 'Novo trigger', now(), 'migration-jh-standard-migration', now(), 'migration-jh-standard-migration', 1)
) AS v(uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
WHERE NOT EXISTS (
  SELECT 1 FROM job.translations t
  WHERE t.key = v.key AND t.language = v.language
);

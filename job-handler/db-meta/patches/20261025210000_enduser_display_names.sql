-- End-user display name — "Job Handler" is the technical service name;
-- the module manages scheduled processes (schedules / runs / rules).
-- The code stays "job" for routes/schemas/access keys.

UPDATE job.translations SET value = 'Gestore dei Processi', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Process Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Process Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Gestionnaire de processus', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Gestor de procesos', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Prozessverwaltung', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Gestor de processos', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'job.module.name' AND language = 'pt-PT' AND deleted_at IS NULL;

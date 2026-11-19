-- Primebrick: run_as label clarity — the badge display names now say
-- WHO the fire runs under, not the wire token:
--   originator → "User Event"   (the user who originated the event)
--   author     → "Trigger Owner" (the trigger's author identity)
-- Wire values and hints are untouched — `originator|author|system` stays
-- the stored/served vocabulary; only `status.*` display labels change.
-- Every UPDATE bumps the audit triple (the getI18nDict freshness contract).

UPDATE job.translations SET value = 'User Event',                  updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'User Event',                  updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Utente Evento',               updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Ereignisbenutzer',            updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Utilisateur de l''événement', updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Usuario del evento',          updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Utilizador do evento',        updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.originator' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations SET value = 'Trigger Owner',               updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Trigger Owner',               updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Proprietario dell''Attivatore', updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Trigger-Besitzer',            updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Propriétaire du déclencheur', updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Propietario del trigger',     updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value = 'Proprietário do trigger',     updated_at = now(), updated_by = 'migration-run-as-labels', version = version + 1 WHERE key = 'job.entities.job_trigger.status.author' AND language = 'pt-PT' AND deleted_at IS NULL;

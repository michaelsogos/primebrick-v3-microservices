-- Primebrick: module display-name rename (remaining languages).
-- "Process Manager" -> "Process Management" per the "Gestione X"
-- naming convention landed in it-IT. de-DE untouched —
-- "Prozessverwaltung" is already management-style.

UPDATE job.translations
   SET value = CASE language
                 WHEN 'en-GB' THEN 'Process Management'
                 WHEN 'en-US' THEN 'Process Management'
                 WHEN 'fr-FR' THEN 'Gestion des processus'
                 WHEN 'es-ES' THEN 'Gestión de procesos'
                 WHEN 'pt-PT' THEN 'Gestão de processos'
               END,
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'job.module.name'
   AND language IN ('en-GB', 'en-US', 'fr-FR', 'es-ES', 'pt-PT');

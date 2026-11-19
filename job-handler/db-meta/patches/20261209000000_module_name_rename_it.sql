-- Primebrick: module display-name rename (it-IT).
-- "Gestore dei Processi" -> "Gestione Processi" — naming-style alignment
-- (Gestione <scope>) for the job.module.name label.

UPDATE job.translations
   SET value      = 'Gestione Processi',
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'job.module.name'
   AND language = 'it-IT';

-- Primebrick: module display-name rename (it-IT).
-- "Gestore delle Email" -> "Gestione Gateway Comunicazione" — aligns the
-- surface label with the transactional communication-engine direction.

UPDATE emailsender.translations
   SET value      = 'Gestione Gateway Comunicazione',
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'emailsender.module.name'
   AND language = 'it-IT';

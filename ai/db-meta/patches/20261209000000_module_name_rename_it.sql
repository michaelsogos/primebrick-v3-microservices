-- Primebrick: module display-name rename (it-IT).
-- "Gestore degli Assistenti AI" -> "Gestione Assistenti AI" —
-- naming-style alignment (Gestione <scope>) for the ai.module.name label.

UPDATE ai.translations
   SET value      = 'Gestione Assistenti AI',
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'ai.module.name'
   AND language = 'it-IT';

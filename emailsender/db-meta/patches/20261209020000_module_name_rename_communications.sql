-- Primebrick: module display-name refinement — drop "Gateway".
-- "Gestione Gateway Comunicazione" -> "Gestione Comunicazioni"; the same
-- simplification applied to every language for coherence.

UPDATE emailsender.translations
   SET value = CASE language
                 WHEN 'it-IT' THEN 'Gestione Comunicazioni'
                 WHEN 'en-GB' THEN 'Communications Management'
                 WHEN 'en-US' THEN 'Communications Management'
                 WHEN 'fr-FR' THEN 'Gestion des communications'
                 WHEN 'es-ES' THEN 'Gestión de comunicaciones'
                 WHEN 'de-DE' THEN 'Kommunikationsverwaltung'
                 WHEN 'pt-PT' THEN 'Gestão de comunicações'
               END,
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'emailsender.module.name'
   AND language IN ('it-IT', 'en-GB', 'en-US', 'fr-FR', 'es-ES', 'de-DE', 'pt-PT');

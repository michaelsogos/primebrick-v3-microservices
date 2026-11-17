-- Primebrick: module display-name rename (remaining languages).
-- "Email Manager" -> "Communication Gateway Management" per the
-- "Gestione X" convention + the communication-gateway direction landed
-- in it-IT ("Gestione Gateway Comunicazione").

UPDATE emailsender.translations
   SET value = CASE language
                 WHEN 'en-GB' THEN 'Communication Gateway Management'
                 WHEN 'en-US' THEN 'Communication Gateway Management'
                 WHEN 'fr-FR' THEN 'Gestion de la passerelle de communication'
                 WHEN 'es-ES' THEN 'Gestión de la pasarela de comunicación'
                 WHEN 'de-DE' THEN 'Kommunikationsgateway-Verwaltung'
                 WHEN 'pt-PT' THEN 'Gestão do gateway de comunicação'
               END,
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'emailsender.module.name'
   AND language IN ('en-GB', 'en-US', 'fr-FR', 'es-ES', 'de-DE', 'pt-PT');

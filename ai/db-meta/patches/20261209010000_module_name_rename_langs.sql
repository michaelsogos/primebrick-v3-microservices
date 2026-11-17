-- Primebrick: module display-name rename (remaining languages).
-- "AI Assistants Manager" -> "AI Assistants Management" per the
-- "Gestione X" naming convention landed in it-IT.

UPDATE ai.translations
   SET value = CASE language
                 WHEN 'en-GB' THEN 'AI Assistants Management'
                 WHEN 'en-US' THEN 'AI Assistants Management'
                 WHEN 'fr-FR' THEN 'Gestion des assistants IA'
                 WHEN 'es-ES' THEN 'Gestión de asistentes de IA'
                 WHEN 'de-DE' THEN 'KI-Assistentenverwaltung'
                 WHEN 'pt-PT' THEN 'Gestão de assistentes de IA'
               END,
       updated_at = now(),
       updated_by = 'migration-module-name',
       version    = version + 1
 WHERE deleted_at IS NULL
   AND key      = 'ai.module.name'
   AND language IN ('en-GB', 'en-US', 'fr-FR', 'es-ES', 'de-DE', 'pt-PT');

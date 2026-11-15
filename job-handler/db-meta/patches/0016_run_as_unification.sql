-- Primebrick: `run_as` unification — one field name, meaningful values.
--
-- `run_as` = the identity the fire executes under. Three entities carried
-- the concept under two jargon names:
--   job_triggers.execution_context → run_as, values user|me|system →
--     originator|author|system (originator = the event originator's
--     AuthUser rides forwarded headers; author = the trigger author's
--     AuthUser resolved fresh at dispatch; system = module privileges)
--   job_schedules.lane             → run_as, values user|system stay
--     (the materialized auth channel — originator/author both travel
--     the user lane on the wire)
--   job_runs.lane                  → run_as, values user|system stay
-- Wire protocol `jobs.due.<user|system>.*` is untouched — the lane
-- segment is the channel vocabulary, not the field name.

-- ---------------------------------------------------------------- DDL

ALTER TABLE job.job_triggers RENAME COLUMN execution_context TO run_as;
ALTER TABLE job.job_triggers ALTER COLUMN run_as TYPE varchar(20);
UPDATE job.job_triggers SET run_as = 'originator' WHERE run_as = 'user';
UPDATE job.job_triggers SET run_as = 'author'     WHERE run_as = 'me';

ALTER TABLE job.job_schedules RENAME COLUMN lane TO run_as;
ALTER TABLE job.job_runs      RENAME COLUMN lane TO run_as;

-- ------------------------------------------------- field label renames
-- Key moves keep the same uuid/audit history; every UPDATE bumps the
-- audit triple (the getI18nDict freshness contract — 0015 lesson).

UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Run As',               updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Run As',               updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Eseguito Come',        updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Exécuté En Tant Que',  updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Ejecutado Como',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Ausführen Als',        updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_trigger.fields.run_as', value = 'Executado Como',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.fields.execution_context' AND language = 'pt-PT';

UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Run As',              updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Run As',              updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Eseguito Come',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Exécuté En Tant Que', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Ejecutado Como',      updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Ausführen Als',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_schedule.fields.run_as', value = 'Executado Como',      updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.lane' AND language = 'pt-PT';

UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Run As',                   updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Run As',                   updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Eseguito Come',            updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Exécuté En Tant Que',      updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Ejecutado Como',           updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Ausführen Als',            updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_run.fields.run_as', value = 'Executado Como',           updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_run.fields.lane' AND language = 'pt-PT';

-- -------------------------------------------------- hint renames + copy
-- The old copy referenced the retired user|me vocabulary and a dead
-- "must match the lane in the destination subject" requirement (the
-- target is a census callable now — the lane is derived, never authored).

UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Run As',               updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Run As',               updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Eseguito Come',        updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Exécuté En Tant Que',  updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Ejecutado Como',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Ausführen Als',        updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as_title', value = 'Executado Como',       updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context_title' AND language = 'pt-PT';

UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` runs the action as the user who triggered the event, with their permissions — requires an event source; `author` runs as the trigger''s author, identity resolved fresh at dispatch time; `system` runs with module privileges.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` runs the action as the user who triggered the event, with their permissions — requires an event source; `author` runs as the trigger''s author, identity resolved fresh at dispatch time; `system` runs with module privileges.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` esegue l''azione come l''utente che ha innescato l''evento, con i suoi permessi — richiede una sorgente evento; `author` come l''autore del trigger, identità risolta al momento dell''esecuzione; `system` con i privilegi del modulo.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` exécute l''action comme l''utilisateur qui a déclenché l''événement, avec ses permissions — requiert une source d''événement ; `author` comme l''auteur du déclencheur, identité résolue au moment de l''exécution ; `system` avec les privilèges du module.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` ejecuta la acción como el usuario que disparó el evento, con sus permisos — requiere una fuente de evento; `author` como el autor del trigger, identidad resuelta en el momento de la ejecución; `system` con privilegios del módulo.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` führt die Aktion als der auslösende Benutzer aus, mit dessen Berechtigungen — erfordert eine Ereignisquelle; `author` als der Autor des Triggers, Identität wird zum Ausführungszeitpunkt aufgelöst; `system` mit Modulprivilegien.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_trigger.hints.run_as', value = '`originator` executa a ação como o utilizador que despoletou o evento, com as suas permissões — requer uma fonte de evento; `author` como o autor do trigger, identidade resolvida no momento da execução; `system` com privilégios do módulo.', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'pt-PT';

-- -------------------------------------------------- badge value renames
-- status.user → status.originator, status.me → status.author
-- (status.system already exists and stays).

UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Originator', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Originator', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Origine',    updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Origine',    updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Origen',     updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Auslöser',   updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.originator', value = 'Origem',     updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.user' AND language = 'pt-PT';

UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Author', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'en-GB';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Author', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'en-US';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Autore', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'it-IT';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Auteur', updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'fr-FR';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Autor',  updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'es-ES';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Autor',  updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'de-DE';
UPDATE job.translations SET key = 'job.entities.job_trigger.status.author', value = 'Autor',  updated_at = now(), updated_by = 'migration-run-as', version = version + 1 WHERE key = 'job.entities.job_trigger.status.me' AND language = 'pt-PT';

-- ------------------------------------- badge vocab for schedule/run run_as
-- The authored `run_as` badge columns on job_schedule/job_run carry the
-- materialized channel: `user` = a user-context identity, `system` =
-- module privileges. Person labels, consistent with the trigger vocab.

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.status.user',   'en-GB', 'User',        now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'en-US', 'User',        now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'it-IT', 'Utente',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'fr-FR', 'Utilisateur', now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'es-ES', 'Usuario',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'de-DE', 'Benutzer',    now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.user',   'pt-PT', 'Utilizador',  now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'en-GB', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'en-US', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'it-IT', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'fr-FR', 'Système',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'es-ES', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'de-DE', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_schedule.status.system', 'pt-PT', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'en-GB', 'User',        now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'en-US', 'User',        now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'it-IT', 'Utente',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'fr-FR', 'Utilisateur', now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'es-ES', 'Usuario',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'de-DE', 'Benutzer',    now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.user',        'pt-PT', 'Utilizador',  now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'en-GB', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'en-US', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'it-IT', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'fr-FR', 'Système',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'es-ES', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'de-DE', 'System',      now(), 'migration-run-as', now(), 'migration-run-as', 1),
  (uuidv7(), 'job.entities.job_run.status.system',      'pt-PT', 'Sistema',     now(), 'migration-run-as', now(), 'migration-run-as', 1);

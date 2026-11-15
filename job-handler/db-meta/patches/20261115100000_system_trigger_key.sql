-- Primebrick: system triggers — `system_key` on job.job_triggers.
--
-- A trigger row is the single declaration of record for EVERY scheduled
-- job: user-made (`system_key` NULL) and module-declared (`system_key`
-- set, materialized by the owning service at registration). `is_system`
-- is a projected derivation in code (`system_key IS NOT NULL`) — one
-- physical source, never a second truth to keep in step.
--
-- The partial unique index is a live-row net only: one live trigger per
-- module job id. A soft-deleted row does NOT free the key for
-- resurrection — reconcile skips deleted rows by code rule.

ALTER TABLE "job"."job_triggers" ADD COLUMN "system_key" text;
CREATE UNIQUE INDEX "job_triggers_system_key_uq"
  ON "job"."job_triggers" ("system_key") WHERE "deleted_at" IS NULL;

-- ------------------------------------------------- field labels + hints

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'en-GB', 'System', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'en-US', 'System', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'it-IT', 'Sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'de-DE', 'System', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'es-ES', 'Sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'fr-FR', 'Système', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.is_system', 'pt-PT', 'Sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),

  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'en-GB', 'System key', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'en-US', 'System key', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'it-IT', 'Chiave di sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'de-DE', 'Systemschlüssel', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'es-ES', 'Clave de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'fr-FR', 'Clé système', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.fields.system_key', 'pt-PT', 'Chave de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),

  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'en-GB', 'System trigger', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'en-US', 'System trigger', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'it-IT', 'Trigger di sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'de-DE', 'System-Trigger', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'es-ES', 'Trigger de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'fr-FR', 'Déclencheur système', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system_title', 'pt-PT', 'Trigger de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),

  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'en-GB', 'Declared by a module, not by a user — source, destination, execution identity and payload contract are code-owned and read-only. Schedule and name stay yours.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'en-US', 'Declared by a module, not by a user — source, destination, execution identity and payload contract are code-owned and read-only. Schedule and name stay yours.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'it-IT', 'Dichiarato da un modulo, non da un utente — sorgente, destinazione, identità di esecuzione e contratto del payload sono gestiti dal codice e in sola lettura. Pianificazione e nome restano tuoi.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'de-DE', 'Von einem Modul deklariert, nicht von einem Benutzer — Quelle, Ziel, Ausführungsidentität und Payload-Vertrag sind code-verwaltet und schreibgeschützt. Zeitplan und Name bleiben Ihre.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'es-ES', 'Declarado por un módulo, no por un usuario — origen, destino, identidad de ejecución y contrato de payload son gestionados por el código y de solo lectura. Programación y nombre siguen siendo tuyos.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'fr-FR', 'Déclaré par un module, pas par un utilisateur — source, destination, identité d''exécution et contrat de payload sont gérés par le code et en lecture seule. Planification et nom restent à vous.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.is_system', 'pt-PT', 'Declarado por um módulo, não por um utilizador — origem, destino, identidade de execução e contrato de payload são geridos pelo código e apenas de leitura. Agendamento e nome continuam seus.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),

  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'en-GB', 'System key', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'en-US', 'System key', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'it-IT', 'Chiave di sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'de-DE', 'Systemschlüssel', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'es-ES', 'Clave de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'fr-FR', 'Clé système', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key_title', 'pt-PT', 'Chave de sistema', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),

  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'en-GB', 'The module''s stable identifier for this job — the anchor new releases reconcile against. Empty on triggers you created.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'en-US', 'The module''s stable identifier for this job — the anchor new releases reconcile against. Empty on triggers you created.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'it-IT', 'L''identificativo stabile del modulo per questo job — l''ancora su cui le nuove release si riconciliano. Vuoto sui trigger creati da te.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'de-DE', 'Die stabile Modul-Kennung für diesen Job — der Anker, gegen den neue Releases abgleichen. Leer bei Triggern, die Sie erstellt haben.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'es-ES', 'El identificador estable del módulo para este trabajo — el ancla con la que se reconcilian las nuevas versiones. Vacío en triggers creados por ti.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'fr-FR', 'L''identifiant stable du module pour ce job — l''ancre sur laquelle les nouvelles versions se reconcilient. Vide sur les déclencheurs que vous avez créés.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1),
  (uuidv7(), 'job.entities.job_trigger.hints.system_key', 'pt-PT', 'O identificador estável do módulo para este trabalho — a âncora contra a qual as novas versões se reconciliam. Vazio em triggers criados por si.', now(), 'migration-system-trigger', now(), 'migration-system-trigger', 1);

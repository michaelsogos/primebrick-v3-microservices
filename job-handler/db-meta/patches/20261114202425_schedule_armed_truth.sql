-- Primebrick: schedule arm-truth consolidation
--
-- Single source of truth for "when did it run / when will it run / who
-- armed it" on job.job_schedules:
--
--   fired_at          — DROP the write-only physical stamp (it was only
--                       written for one-shot fires and never read). The
--                       served `fired_at` is now a @Calculated projection:
--                       max(job_runs.created_at) WHERE status <> 'skipped'
--                       — the last ACTUAL execution for every kind.
--   next_run_at       — RENAME to next_fire_mirror_at (internal NATS
--                       mirror column). The served `next_run_at` becomes
--                       a @Calculated gate: NULL whenever status is not
--                       executable — a disabled/paused/terminal schedule
--                       has no next run, whatever the mirror was left
--                       holding (live bug: demo-once disarmed yet still
--                       showed a future next run).
--   created_by        — PURGE the legacy provenance soup. `trigger:*`,
--                       `rule:*`, `service:*` and bare service codes were
--                       provenance disguised as audit writers. Arm
--                       ownership now derives structurally (trigger_uuid
--                       → job_triggers.name; service_code →
--                       service_registry). Writers stamp `system:*`.
--
-- Labels/hints follow the new semantics: `armed_at`/`disarmed_at` name
-- the ARM/DISARM act (not enable/disable); new field hints document the
-- armed-by lazy ref, the execution-context lane and the two timestamp
-- projections; `lost`/`missed` join the run-status vocabulary for the
-- extended run-stats sparkline.

-- ---------------------------------------------------------------- DDL

ALTER TABLE "job"."job_schedules" DROP COLUMN "fired_at";
ALTER TABLE "job"."job_schedules" RENAME COLUMN "next_run_at" TO "next_fire_mirror_at";

-- ---------------------------------------------------- provenance purge
-- trigger:<name>/rule:<name> were written by the triggers engine (which
-- runs inside the job service) → system:job. service:<svc> and bare
-- service codes → system:<svc>. `system:*` stamps and user uuids are
-- already honest and stay untouched.

UPDATE job.job_schedules
SET created_by = 'system:job',
    updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1
WHERE created_by ~ '^(trigger|rule):';

UPDATE job.job_schedules
SET created_by = 'system:' || substring(created_by from '^service:(.+)$'),
    updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1
WHERE created_by ~ '^service:';

UPDATE job.job_schedules
SET created_by = 'system:' || created_by,
    updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1
WHERE created_by IS NOT NULL
  AND created_by !~ '^system:'
  AND created_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ---------------------------------------------------------- relabels
-- armed_at/disarmed_at name the arm/disarm stamp — "Abilitata il" meant
-- enabled, which is not what the column carries.

UPDATE job.translations SET value = 'Armed at',          updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'en-GB';
UPDATE job.translations SET value = 'Armed at',          updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'en-US';
UPDATE job.translations SET value = 'Armata il',         updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'it-IT';
UPDATE job.translations SET value = 'Scharfgestellt am', updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'de-DE';
UPDATE job.translations SET value = 'Armada el',         updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'es-ES';
UPDATE job.translations SET value = 'Armée le',          updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'fr-FR';
UPDATE job.translations SET value = 'Armada em',         updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.armed_at'    AND language = 'pt-PT';

UPDATE job.translations SET value = 'Disarmed at',       updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'en-GB';
UPDATE job.translations SET value = 'Disarmed at',       updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'en-US';
UPDATE job.translations SET value = 'Disarmata il',      updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'it-IT';
UPDATE job.translations SET value = 'Entschärft am',     updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'de-DE';
UPDATE job.translations SET value = 'Desarmada el',      updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'es-ES';
UPDATE job.translations SET value = 'Désarmée le',       updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Desarmada em',      updated_at = now(), updated_by = 'migration-armed-truth', version = version + 1 WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'pt-PT';

-- ------------------------------------------------------ new label rows
-- Run-status vocabulary (badge + sparkline legend) and the hidden
-- plumbing columns that auto-emit a label key.

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_run.status.lost', 'en-GB', 'Lost', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'en-US', 'Lost', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'it-IT', 'Persa', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'de-DE', 'Verloren', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'es-ES', 'Perdida', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'fr-FR', 'Perdu', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.lost', 'pt-PT', 'Perdida', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'en-GB', 'Missed', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'en-US', 'Missed', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'it-IT', 'Mancata', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'de-DE', 'Versäumt', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'es-ES', 'Omitida', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'fr-FR', 'Manqué', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_run.status.missed', 'pt-PT', 'Omitida', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'en-GB', 'Next fire mirror', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'en-US', 'Next fire mirror', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'it-IT', 'Specchio prossima esecuzione', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'de-DE', 'Spiegel der nächsten Ausführung', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'es-ES', 'Espejo de próxima ejecución', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'fr-FR', 'Miroir de la prochaine exécution', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.next_fire_mirror_at', 'pt-PT', 'Espelho da próxima execução', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'en-GB', 'Armed-by target entity', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'en-US', 'Armed-by target entity', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'it-IT', 'Entità destinazione armato-da', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'de-DE', 'Ziel-Entität der Aktivierung', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'es-ES', 'Entidad destino del armado', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'fr-FR', 'Entité cible de l’armement', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_entity', 'pt-PT', 'Entidade de destino do armamento', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'en-GB', 'Armed-by target key', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'en-US', 'Armed-by target key', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'it-IT', 'Chiave destinazione armato-da', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'de-DE', 'Ziel-Schlüssel der Aktivierung', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'es-ES', 'Clave destino del armado', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'fr-FR', 'Clé cible de l’armement', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_ref_key', 'pt-PT', 'Chave de destino do armamento', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1);

-- ------------------------------------------------------- new hint rows
-- Tooltips the meta now declares: armed_by (lazy ref), run_as
-- (execution-context lane), fired_at + next_run_at (the two
-- projections).

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'en-GB', 'Armed by', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'en-US', 'Armed by', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'it-IT', 'Armato da', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'de-DE', 'Scharfgestellt von', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'es-ES', 'Armado por', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'fr-FR', 'Armé par', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by_title', 'pt-PT', 'Armado por', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'en-GB', 'Who or what armed this schedule — the owning trigger or the declaring module. Open the cell to inspect its record.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'en-US', 'Who or what armed this schedule — the owning trigger or the declaring module. Open the cell to inspect its record.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'it-IT', 'Chi o cosa ha armato questa pianificazione — il trigger proprietario o il modulo che l''ha dichiarata. Apri la cella per ispezionare il record.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'de-DE', 'Wer oder was diese Planung scharfgestellt hat — der besitzende Trigger oder das deklarierende Modul. Zelle öffnen, um den Datensatz zu prüfen.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'es-ES', 'Quién o qué armó esta programación — el trigger propietario o el módulo que la declaró. Abre la celda para inspeccionar el registro.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'fr-FR', 'Qui ou quoi a armé cette planification — le déclencheur propriétaire ou le module qui l''a déclarée. Ouvrez la cellule pour inspecter l''enregistrement.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.armed_by', 'pt-PT', 'Quem ou o quê armou este agendamento — o trigger proprietário ou o módulo que o declarou. Abra a célula para inspecionar o registo.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'en-GB', 'Run as', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'en-US', 'Run as', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'it-IT', 'Eseguito come', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'de-DE', 'Ausführen als', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'es-ES', 'Ejecutado como', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'fr-FR', 'Exécuté en tant que', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as_title', 'pt-PT', 'Executado como', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'en-GB', 'The identity the fire executes under — `user` inherits the originator''s or author''s credentials, `system` runs with module privileges.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'en-US', 'The identity the fire executes under — `user` inherits the originator''s or author''s credentials, `system` runs with module privileges.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'it-IT', 'L''identità con cui il job viene eseguito — `user` eredita le credenziali dell''autore o dell''originatore, `system` gira con i privilegi del modulo.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'de-DE', 'Die Identität, unter der der Job ausgeführt wird — `user` erbt die Anmeldedaten des Autors oder Auslösers, `system` läuft mit Modulberechtigungen.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'es-ES', 'La identidad con la que se ejecuta el trabajo — `user` hereda las credenciales del autor o del originador, `system` se ejecuta con privilegios del módulo.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'fr-FR', 'L''identité sous laquelle le travail s''exécute — `user` hérite des identifiants de l''auteur ou de l''initiateur, `system` s''exécute avec les privilèges du module.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.run_as', 'pt-PT', 'A identidade sob a qual o trabalho é executado — `user` herda as credenciais do autor ou do originador, `system` executa com privilégios do módulo.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'en-GB', 'Last executed at', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'en-US', 'Last executed at', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'it-IT', 'Ultima esecuzione', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'de-DE', 'Zuletzt ausgeführt', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'es-ES', 'Última ejecución', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'fr-FR', 'Dernière exécution', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at_title', 'pt-PT', 'Última execução', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'en-GB', 'When the job last actually ran — every origin counts (trigger, module, system, user). Suppressed fires are excluded: a skipped due never executed.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'en-US', 'When the job last actually ran — every origin counts (trigger, module, system, user). Suppressed fires are excluded: a skipped due never executed.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'it-IT', 'Quando il job è stato eseguito l''ultima volta — conta ogni origine (trigger, modulo, sistema, utente). Le esecuzioni soppresse sono escluse: un due saltato non è mai stato eseguito.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'de-DE', 'Wann der Job zuletzt tatsächlich lief — jede Quelle zählt (Trigger, Modul, System, Benutzer). Unterdrückte Auslösungen zählen nicht: ein übersprungener Fälligkeitstermin wurde nie ausgeführt.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'es-ES', 'Cuándo se ejecutó el trabajo por última vez — cuenta cualquier origen (trigger, módulo, sistema, usuario). Los disparos suprimidos se excluyen: un vencimiento omitido nunca se ejecutó.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'fr-FR', 'Quand le travail a réellement tourné pour la dernière fois — toute origine compte (déclencheur, module, système, utilisateur). Les déclenchements supprimés sont exclus : une échéance ignorée ne s''est jamais exécutée.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.fired_at', 'pt-PT', 'Quando o trabalho foi realmente executado pela última vez — qualquer origem conta (trigger, módulo, sistema, utilizador). Os disparos suprimidos são excluídos: um vencimento ignorado nunca foi executado.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'en-GB', 'Next run', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'en-US', 'Next run', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'it-IT', 'Prossima esecuzione', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'de-DE', 'Nächste Ausführung', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'es-ES', 'Próxima ejecución', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'fr-FR', 'Prochaine exécution', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at_title', 'pt-PT', 'Próxima execução', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'en-GB', 'Next scheduled fire, mirrored from the scheduler. Empty whenever the schedule cannot run — disabled, paused, stopped, already fired or expired.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'en-US', 'Next scheduled fire, mirrored from the scheduler. Empty whenever the schedule cannot run — disabled, paused, stopped, already fired or expired.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'it-IT', 'Prossima esecuzione pianificata, replicata dallo scheduler. Vuota quando la pianificazione non può girare — disarmata, in pausa, fermata, già eseguita o scaduta.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'de-DE', 'Nächste geplante Ausführung, vom Scheduler gespiegelt. Leer, wenn die Planung nicht laufen kann — deaktiviert, pausiert, gestoppt, bereits ausgeführt oder abgelaufen.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'es-ES', 'Próxima ejecución programada, reflejada del planificador. Vacía cuando la programación no puede ejecutarse — desarmada, en pausa, detenida, ya ejecutada o expirada.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'fr-FR', 'Prochaine exécution planifiée, reflétée depuis l''ordonnanceur. Vide lorsque la planification ne peut pas s''exécuter — désarmée, en pause, arrêtée, déjà exécutée ou expirée.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.next_run_at', 'pt-PT', 'Próxima execução agendada, replicada do agendador. Vazia quando o agendamento não pode executar — desarmado, em pausa, parado, já executado ou expirado.', now(), 'migration-armed-truth', now(), 'migration-armed-truth', 1);

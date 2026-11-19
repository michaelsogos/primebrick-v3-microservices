-- Primebrick: job_run lineage + diagnostics — stamped refs, destination,
-- and the closed error_code vocabulary.
--
-- Lineage stops depending on the ephemeral schedule mirror: `trigger_uuid`
-- and `target_subject` become PHYSICAL columns stamped at write time
-- (`due-forwarder` already holds the schedule row for the armed gate;
-- `recordDirectRun` best-effort lookups by subject). The `trigger`
-- @Calculated rebinds to the stamped uuid — schedules are hard-deleted,
-- triggers are not, so the armer identity now survives schedule churn.
-- `target_subject` mirrors `job_schedules.target_subject` (the callable
-- destination), NOT the mixed-derivation `job_name` display field.
--
-- `error_code` becomes a closed enum (the badge contract forbids raw
-- values): legacy interpolated reasons (`schedule paused/disarmed`) map to
-- `SCHEDULE_*`; callable-reported codes outside the known set normalize to
-- `EXECUTION_ERROR` at write time (original preserved in `error_detail`).
--
-- Dead keys from the reversed view_run CTA and the red-italic `null_label`
-- misuse are dropped (`states.manual`, `actions.view_run`).

ALTER TABLE "job"."job_runs" ADD COLUMN IF NOT EXISTS "trigger_uuid" uuid;
ALTER TABLE "job"."job_runs" ADD COLUMN IF NOT EXISTS "target_subject" text;

-- ── trigger_uuid backfill ─────────────────────────────────────────────
-- 1) live mirror join — the schedule row still exists
UPDATE job.job_runs r SET trigger_uuid = js.trigger_uuid
  FROM job.job_schedules js
 WHERE js.schedule_subject = r.schedule_subject
   AND r.trigger_uuid IS NULL;
-- 2) mirror-subject suffix — `jobs.schedule.job.<uuid>` embeds the owning
--    trigger uuid on the current minting convention; verified against a
--    live `job_triggers` row before stamping (older subjects embedded the
--    schedule's own uuid instead and simply won't match).
UPDATE job.job_runs r SET trigger_uuid = t.uuid
  FROM job.job_triggers t
 WHERE r.trigger_uuid IS NULL
   AND r.schedule_subject LIKE 'jobs.schedule.job.%'
   AND t.uuid::text = substring(r.schedule_subject from 'jobs\.schedule\.job\.(.+)$');

-- ── target_subject backfill ───────────────────────────────────────────
-- 1) live schedule rows carry the callable destination verbatim
UPDATE job.job_runs r SET target_subject = js.target_subject
  FROM job.job_schedules js
 WHERE js.schedule_subject = r.schedule_subject
   AND r.target_subject IS NULL;
-- 2) forwarder rows stored `envelope.target` verbatim as `job_name` —
--    callable-shaped values recover the destination; bare action names
--    (own-lane parse derivations) can't be reconstructed and stay NULL.
UPDATE job.job_runs SET target_subject = job_name
 WHERE target_subject IS NULL
   AND job_name ~ '^[a-z0-9-]+\.[a-z0-9.-]+$';

-- ── error_code enum normalization ─────────────────────────────────────
UPDATE job.job_runs SET error_code = 'SCHEDULE_PAUSED'   WHERE error_code = 'schedule paused';
UPDATE job.job_runs SET error_code = 'SCHEDULE_DISARMED' WHERE error_code = 'schedule disarmed';

-- ── dead keys: reversed view_run CTA + misuse of destructive null_label ─
DELETE FROM job.translations WHERE key LIKE 'job.entities.job_run.actions.view_run';
DELETE FROM job.translations WHERE key LIKE 'job.entities.job_run.fields.%.states.manual';

-- ── new keys: destination, schedule ref, error_code vocabulary ────────
INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  -- fields.target_subject — destination subject (mirrors schedules' label family)
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'en-GB', 'Destination Event',      now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'en-US', 'Destination Event',      now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'it-IT', 'Destinazione Evento',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'fr-FR', 'Destination de l''événement', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'es-ES', 'Destino del evento',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'de-DE', 'Ereignisziel',           now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.target_subject', 'pt-PT', 'Destino do evento',      now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  -- fields.schedule — the owning schedule (ref column, business-key drill)
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'en-GB', 'Job Schedule',        now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'en-US', 'Job Schedule',        now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'it-IT', 'Pianificazione Job',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'fr-FR', 'Planification de Job', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'es-ES', 'Programación de Job', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'de-DE', 'Job-Zeitplan',        now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule', 'pt-PT', 'Agendamento de Job',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  -- status.* error_code vocabulary — JH + SDK transport + normalized skips
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'en-GB', 'Execution Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'en-US', 'Execution Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'it-IT', 'Errore di Esecuzione', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'fr-FR', 'Erreur d''exécution', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'es-ES', 'Error de ejecución',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'de-DE', 'Ausführungsfehler',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.execution_error', 'pt-PT', 'Erro de execução',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'en-GB', 'Handler Error',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'en-US', 'Handler Error',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'it-IT', 'Errore del Gestore', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'fr-FR', 'Erreur du gestionnaire', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'es-ES', 'Error del manejador',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'de-DE', 'Handler-Fehler',        now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.handler_error', 'pt-PT', 'Erro do manipulador',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'en-GB', 'Denied',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'en-US', 'Denied',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'it-IT', 'Negato',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'fr-FR', 'Refusé',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'es-ES', 'Denegado', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'de-DE', 'Verweigert', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.denied', 'pt-PT', 'Negado',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'en-GB', 'Validation Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'en-US', 'Validation Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'it-IT', 'Errore di Validazione', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'fr-FR', 'Erreur de validation',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'es-ES', 'Error de validación',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'de-DE', 'Validierungsfehler',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.validation_error', 'pt-PT', 'Erro de validação',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'en-GB', 'Dispatch Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'en-US', 'Dispatch Error',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'it-IT', 'Errore di Invio', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'fr-FR', 'Erreur d''envoi', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'es-ES', 'Error de envío',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'de-DE', 'Versandfehler',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_error', 'pt-PT', 'Erro de envio',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'en-GB', 'Dispatch Timeout',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'en-US', 'Dispatch Timeout',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'it-IT', 'Timeout di Invio',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'fr-FR', 'Délai d''envoi dépassé', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'es-ES', 'Tiempo de envío agotado', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'de-DE', 'Versand-Zeitüberschreitung', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.dispatch_timeout', 'pt-PT', 'Tempo de envio esgotado', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'en-GB', 'Unresolvable Actor',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'en-US', 'Unresolvable Actor',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'it-IT', 'Attore Non Risolvibile', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'fr-FR', 'Acteur non résoluble',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'es-ES', 'Actor no resoluble',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'de-DE', 'Akteur nicht auflösbar', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.auth_actor_unresolvable', 'pt-PT', 'Ator não resolvível',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'en-GB', 'Schedule Paused',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'en-US', 'Schedule Paused',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'it-IT', 'Pianificazione in Pausa', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'fr-FR', 'Planification en pause',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'es-ES', 'Programación en pausa',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'de-DE', 'Zeitplan pausiert',       now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_paused', 'pt-PT', 'Agendamento pausado',     now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'en-GB', 'Schedule Disarmed',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'en-US', 'Schedule Disarmed',  now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'it-IT', 'Pianificazione Disarmata', now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'fr-FR', 'Planification désarmée',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'es-ES', 'Programación desarmada',   now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'de-DE', 'Zeitplan entschärft',      now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1),
  (uuidv7(), 'job.entities.job_run.status.schedule_disarmed', 'pt-PT', 'Agendamento desarmado',    now(), 'migration-run-lineage', now(), 'migration-run-lineage', 1);

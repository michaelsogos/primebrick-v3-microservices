-- Primebrick: job_run page overhaul — schema drop + vocabulary realign.
--
-- `job.job_runs.service_code` is retired: a second truth that lied.
-- On ~84% of observed rows it duplicated `created_by` verbatim
-- (own-lane self-recording stamps `system:<svc>`; forwarded rows stamp
-- `system:job` as the writer) and on the rest it named the wrong
-- executor (trampoline dues record `job` for every callable). No
-- business logic ever read it — provenance belongs to `created_by`,
-- the same contract `job_schedules` reached with
-- `20261115220000_schedule_service_code_drop`.
--
-- `schedule_subject` is a NATS ingress queue like every sibling subject
-- field — it takes the "Source Queue" label family (the "Pianificazione"
-- word belongs to `schedule_spec` on triggers). Its NULL state (manual
-- run) gets a `states.manual` label, shared with the new `trigger`
-- column. `fields.report`/`fields.fire_seq` labels already exist.

ALTER TABLE "job"."job_runs" DROP COLUMN "service_code";

-- ── schedule_subject → "Source Queue" family ─────────────────────────
UPDATE job.translations SET value = 'Source Queue',     updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'en-GB';
UPDATE job.translations SET value = 'Source Queue',     updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'en-US';
UPDATE job.translations SET value = 'Coda di Ingresso', updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'it-IT';
UPDATE job.translations SET value = 'File source',      updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Cola de origen',   updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'es-ES';
UPDATE job.translations SET value = 'Quell-Queue',      updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'de-DE';
UPDATE job.translations SET value = 'Fila de origem',   updated_at = now(), updated_by = 'migration-run-page', version = version + 1
  WHERE key = 'job.entities.job_run.fields.schedule_subject' AND language = 'pt-PT';

-- ── dropped column loses its label keys ──────────────────────────────
DELETE FROM job.translations WHERE key = 'job.entities.job_run.fields.service_code';

-- ── new keys: trigger ref, manual states, outcome preset, view_run ───
INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  -- fields.trigger — the owning trigger (calculated ref, drills by uuid)
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'en-GB', 'Trigger',      now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'en-US', 'Trigger',      now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'it-IT', 'Attivatore',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'fr-FR', 'Déclencheur',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'es-ES', 'Disparador',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'de-DE', 'Trigger',      now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger', 'pt-PT', 'Acionador',    now(), 'migration-run-page', now(), 'migration-run-page', 1),
  -- fields.trigger_uuid — hidden drill key; same words as `trigger`
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'en-GB', 'Trigger',     now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'en-US', 'Trigger',     now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'it-IT', 'Attivatore',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'fr-FR', 'Déclencheur', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'es-ES', 'Disparador',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'de-DE', 'Trigger',     now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger_uuid', 'pt-PT', 'Acionador',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  -- states.manual — NULL schedule_subject / trigger = ran by hand, no queue
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'en-GB', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'en-US', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'it-IT', 'Manuale',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'fr-FR', 'Manuel',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'es-ES', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'de-DE', 'Manuell',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.trigger.states.manual', 'pt-PT', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'en-GB', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'en-US', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'it-IT', 'Manuale',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'fr-FR', 'Manuel',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'es-ES', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'de-DE', 'Manuell',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.fields.schedule_subject.states.manual', 'pt-PT', 'Manual',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  -- presets.outcome — toolbar button group owning the `status` field;
  -- option labels reuse `status.*`, only group label/all/tooltips are new
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'en-GB', 'Outcome',    now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'en-US', 'Outcome',    now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'it-IT', 'Esito',      now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'fr-FR', 'Résultat',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'es-ES', 'Resultado',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'de-DE', 'Ergebnis',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.label', 'pt-PT', 'Resultado',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'en-GB', 'All',    now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'en-US', 'All',    now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'it-IT', 'Tutte',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'fr-FR', 'Toutes', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'es-ES', 'Todas',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'de-DE', 'Alle',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all', 'pt-PT', 'Todas',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'en-GB', 'All runs — no outcome filter', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'en-US', 'All runs — no outcome filter', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'it-IT', 'Tutte le esecuzioni — nessun filtro per esito', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'fr-FR', 'Toutes les exécutions — sans filtre de résultat', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'es-ES', 'Todas las ejecuciones — sin filtro de resultado', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'de-DE', 'Alle Ausführungen — kein Ergebnisfilter', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.all_tip', 'pt-PT', 'Todas as execuções — sem filtro de resultado', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'en-GB', 'Runs that completed successfully', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'en-US', 'Runs that completed successfully', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'it-IT', 'Esecuzioni completate con successo', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'fr-FR', 'Exécutions terminées avec succès', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'es-ES', 'Ejecuciones completadas correctamente', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'de-DE', 'Erfolgreich abgeschlossene Ausführungen', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.succeeded_tip', 'pt-PT', 'Execuções concluídas com sucesso', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'en-GB', 'Runs that ended with an error', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'en-US', 'Runs that ended with an error', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'it-IT', 'Esecuzioni finite in errore', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'fr-FR', 'Exécutions terminées en erreur', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'es-ES', 'Ejecuciones terminadas con error', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'de-DE', 'Mit Fehler beendete Ausführungen', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.failed_tip', 'pt-PT', 'Execuções terminadas com erro', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'en-GB', 'Runs sent to the executor — no outcome yet', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'en-US', 'Runs sent to the executor — no outcome yet', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'it-IT', 'Esecuzioni inviate all''esecutore — esito non ancora arrivato', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'fr-FR', 'Exécutions envoyées à l''exécuteur — pas encore de résultat', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'es-ES', 'Ejecuciones enviadas al ejecutor — sin resultado todavía', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'de-DE', 'An den Ausführer gesendete Ausführungen — noch kein Ergebnis', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.dispatched_tip', 'pt-PT', 'Execuções enviadas ao executor — ainda sem resultado', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'en-GB', 'Dues suppressed before running — nothing executed', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'en-US', 'Dues suppressed before running — nothing executed', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'it-IT', 'Due soppressi prima della partenza — nulla è stato eseguito', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'fr-FR', 'Exécutions supprimées avant le départ — rien n''a tourné', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'es-ES', 'Ejecuciones suprimidas antes de arrancar — nada se ejecutó', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'de-DE', 'Vor dem Start unterdrückte Ausführungen — nichts lief', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.skipped_tip', 'pt-PT', 'Execuções suprimidas antes de iniciar — nada correu', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'en-GB', 'Dispatched but never reported back — outcome unknown', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'en-US', 'Dispatched but never reported back — outcome unknown', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'it-IT', 'Inviate ma mai rientrate — esito sconosciuto', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'fr-FR', 'Envoyées mais jamais rapportées — résultat inconnu', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'es-ES', 'Enviadas pero nunca reportadas — resultado desconocido', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'de-DE', 'Gesendet, aber nie zurückgemeldet — Ergebnis unbekannt', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.presets.outcome.lost_tip', 'pt-PT', 'Enviadas mas nunca reportadas — resultado desconhecido', now(), 'migration-run-page', now(), 'migration-run-page', 1),
  -- actions.view_run — opens the run's record sheet (read-only entity)
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'en-GB', 'Details',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'en-US', 'Details',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'it-IT', 'Dettagli',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'fr-FR', 'Détails',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'es-ES', 'Detalles',  now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'de-DE', 'Details',   now(), 'migration-run-page', now(), 'migration-run-page', 1),
  (uuidv7(), 'job.entities.job_run.actions.view_run', 'pt-PT', 'Detalhes',  now(), 'migration-run-page', now(), 'migration-run-page', 1);

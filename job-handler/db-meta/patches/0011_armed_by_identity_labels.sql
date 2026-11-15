-- Primebrick: armed_by identity + subject/destination label overhaul.
--
-- `job_schedules.job_name`/`initiator` and `job_runs.initiator` were
-- write-only snapshots that always carried service_code — the schedule's
-- identity now resolves through the calculated `armed_by` projection
-- (trigger name → armer profile → service code). Physical columns are
-- dropped; audit partitions are delta-only so they keep history as-is.
--
-- Labels realign to the domain vocabulary: the schedule listens on a
-- source queue and fires a destination event; `kind` badge values read
-- System/User; job_run.job_name (the run's own identity, kept) reads
-- "Job Name". Dropped columns lose their label keys; armed_by and the
-- two subject tooltips get theirs.

ALTER TABLE job.job_schedules DROP COLUMN job_name;
ALTER TABLE job.job_schedules DROP COLUMN initiator;
ALTER TABLE job.job_runs DROP COLUMN initiator;

-- ── schedule_subject → "Source Queue" family ───────────────────────────
UPDATE job.translations SET value = 'Source Queue', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'en-GB';
UPDATE job.translations SET value = 'Source Queue', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'en-US';
UPDATE job.translations SET value = 'Coda di Ingresso', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'it-IT';
UPDATE job.translations SET value = 'File source', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Cola de origen', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'es-ES';
UPDATE job.translations SET value = 'Quell-Queue', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'de-DE';
UPDATE job.translations SET value = 'Fila de origem', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_subject' AND language = 'pt-PT';

-- ── target_subject → "Destination Event" family ───────────────────────
UPDATE job.translations SET value = 'Destination Event', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'en-GB';
UPDATE job.translations SET value = 'Destination Event', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'en-US';
UPDATE job.translations SET value = 'Destinazione Evento', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'it-IT';
UPDATE job.translations SET value = 'Destination de l''événement', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Destino del evento', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'es-ES';
UPDATE job.translations SET value = 'Ereignisziel', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'de-DE';
UPDATE job.translations SET value = 'Destino do evento', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.target_subject' AND language = 'pt-PT';

-- ── kind badge values ─────────────────────────────────────────────────
UPDATE job.translations SET value = 'System', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'en-GB';
UPDATE job.translations SET value = 'System', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'en-US';
UPDATE job.translations SET value = 'Sistema', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'it-IT';
UPDATE job.translations SET value = 'Système', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Sistema', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'es-ES';
UPDATE job.translations SET value = 'System', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'de-DE';
UPDATE job.translations SET value = 'Sistema', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.infra_derived' AND language = 'pt-PT';

UPDATE job.translations SET value = 'User', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'en-GB';
UPDATE job.translations SET value = 'User', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'en-US';
UPDATE job.translations SET value = 'Utente', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'it-IT';
UPDATE job.translations SET value = 'Utilisateur', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Usuario', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'es-ES';
UPDATE job.translations SET value = 'Benutzer', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'de-DE';
UPDATE job.translations SET value = 'Utilizador', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.manual' AND language = 'pt-PT';

-- ── job_run.job_name → "Job Name" family (run identity, kept) ─────────
UPDATE job.translations SET value = 'Job Name', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'en-GB';
UPDATE job.translations SET value = 'Job Name', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'en-US';
UPDATE job.translations SET value = 'Nome Processo', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'it-IT';
UPDATE job.translations SET value = 'Nom du job', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Nombre del job', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'es-ES';
UPDATE job.translations SET value = 'Jobname', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'de-DE';
UPDATE job.translations SET value = 'Nome do job', updated_at = now(), updated_by = 'migration-armed-by-labels', version = version + 1
  WHERE key = 'job.entities.job_run.fields.job_name' AND language = 'pt-PT';

-- ── dropped columns lose their label keys ─────────────────────────────
DELETE FROM job.translations WHERE key IN (
  'job.entities.job_schedule.fields.job_name',
  'job.entities.job_schedule.fields.initiator',
  'job.entities.job_run.fields.initiator');

-- ── new keys: armed_by label + subject tooltips ────────────────────────
INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'en-GB', 'Armed By', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'en-US', 'Armed By', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'it-IT', 'Armato da', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'fr-FR', 'Armé par', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'es-ES', 'Activado por', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'de-DE', 'Aktiviert von', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.armed_by', 'pt-PT', 'Ativado por', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1);

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'en-GB', 'Source Queue', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'en-US', 'Source Queue', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'it-IT', 'Coda di Ingresso', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'fr-FR', 'File source', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'es-ES', 'Cola de origen', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'de-DE', 'Quell-Queue', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject_title', 'pt-PT', 'Fila de origem', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'en-GB', 'The queue this schedule is armed on — the scheduler picks up due work here. Schedules created by the system listen on service-owned queues.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'en-US', 'The queue this schedule is armed on — the scheduler picks up due work here. Schedules created by the system listen on service-owned queues.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'it-IT', 'La coda su cui questa pianificazione è armata — lo scheduler raccoglie qui il lavoro in scadenza. Le pianificazioni create dal sistema ascoltano code dei servizi.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'fr-FR', 'La file sur laquelle cette planification est armée — le planificateur y récupère le travail à exécuter. Les planifications créées par le système écoutent des files de services.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'es-ES', 'La cola en la que esta programación está armada — el planificador recoge aquí el trabajo pendiente. Las programaciones creadas por el sistema escuchan colas de servicios.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'de-DE', 'Die Queue, auf der dieser Zeitplan aktiviert ist — der Scheduler holt hier fällige Arbeit ab. Vom System erstellte Zeitpläne lauschen auf Service-Queues.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.schedule_subject', 'pt-PT', 'A fila em que este agendamento está armado — o agendador recolhe aqui o trabalho pendente. Os agendamentos criados pelo sistema escutam filas de serviços.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1);

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'en-GB', 'Destination Event', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'en-US', 'Destination Event', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'it-IT', 'Destinazione Evento', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'fr-FR', 'Destination de l''événement', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'es-ES', 'Destino del evento', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'de-DE', 'Ereignisziel', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject_title', 'pt-PT', 'Destino do evento', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'en-GB', 'The event fired when the schedule comes due: the operation the run performs (e.g. send an email). Available destinations depend on the active services.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'en-US', 'The event fired when the schedule comes due: the operation the run performs (e.g. send an email). Available destinations depend on the active services.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'it-IT', 'L''evento emesso quando la pianificazione scade: l''operazione che il run esegue (per esempio inviare un''email). Le destinazioni disponibili dipendono dai servizi attivi.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'fr-FR', 'L''événement émis quand la planification arrive à échéance : l''opération que le run exécute (par ex. envoyer un e-mail). Les destinations disponibles dépendent des services actifs.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'es-ES', 'El evento emitido cuando la programación vence: la operación que ejecuta el run (por ej. enviar un correo). Los destinos disponibles dependen de los servicios activos.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'de-DE', 'Das Ereignis, das bei Fälligkeit des Zeitplans ausgelöst wird: die Operation, die der Run ausführt (z. B. eine E-Mail senden). Verfügbare Ziele hängen von den aktiven Diensten ab.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1),
  (uuidv7(), 'job.entities.job_schedule.hints.target_subject', 'pt-PT', 'O evento emitido quando o agendamento vence: a operação que o run executa (por ex. enviar um e-mail). Os destinos disponíveis dependem dos serviços ativos.', now(), 'migration-armed-by-labels', now(), 'migration-armed-by-labels', 1);

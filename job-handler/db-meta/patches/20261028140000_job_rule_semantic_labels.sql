-- Primebrick: Job module — job_rule form semantic labels.
-- Field labels stop naming the transport ("subject") and name the ROLE in
-- the rule: the pair the user reads is Sorgente→Destinazione Evento, and
-- `execution_context` is "who runs the process". `source_subject` stays
-- declared but readonly in the form (Nats-Schedule-Source is disabled
-- pending the workflow engine) — its hint explains the pending state.
-- `job.events.rules_changed.name` feeds the new EmitDecl.label_key
-- (event display name in subject pickers — separate from description_key).
-- `job.jobs.ruleForm.desc` is dropped: this page carries no subtitle
-- (page-level description policy is a root-template decision).
--
-- Convention: `job.entities.job_rule.*` / `job.events.*` / `job.jobs.*`
-- in job.translations (namespace boundary — `job.*` only).

-- ── field labels ───────────────────────────────────────────────────────
UPDATE job.translations
SET value = 'Listening Event', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Sorgente Evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ereignisquelle', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Source de l''événement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Origen del evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Origem do evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.event_subject' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Destination Event', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destinazione Evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ereignisziel', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destination de l''événement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destino del evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destino do evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.target_subject' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Process Executor', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Esecutore del processo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Prozessausführer', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Exécuteur du processus', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ejecutor del proceso', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Executor do processo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.execution_context' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Fire-time Source', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Sorgente al lancio', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Quelle zur Auslösung', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Source au déclenchement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Fuente en ejecución', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Fonte no disparo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.fields.source_subject' AND language = 'pt-PT' AND deleted_at IS NULL;

-- ── hint titles (match the relabeled fields) ───────────────────────────
UPDATE job.translations
SET value = 'Listening event', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Sorgente evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ereignisquelle', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Source de l''événement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Origen del evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Origem do evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.event_subject_title' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Destination event', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destinazione evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ereignisziel', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destination de l''événement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destino del evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Destino do evento', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.target_subject_title' AND language = 'pt-PT' AND deleted_at IS NULL;

-- ── source_subject: explain the disabled/pending state ─────────────────
UPDATE job.translations
SET value = 'Fire-time source', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Sorgente al lancio', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Quelle zur Auslösung', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Source au déclenchement', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Fuente en ejecución', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Fonte no disparo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject_title' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Pending capability — disabled. Will name the subject the scheduler re-reads at fire time so the job runs on CURRENT state instead of the (possibly stale) event payload; the workflow engine supersedes this indirection.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Capacità in sospeso — disabilitata. Indicherà il subject che lo scheduler rilegge al momento del lancio, così il job lavora sullo stato CORRENTE anziché sul payload dell''evento (potenzialmente obsoleto); il motore workflow sostituirà questa indirezione.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Ausstehende Funktion — deaktiviert. Wird das Subject benennen, das der Scheduler zum Auslösezeitpunkt erneut liest, damit der Job auf dem AKTUELLEN Zustand statt auf der (möglicherweise veralteten) Ereignis-Payload läuft; die Workflow-Engine ersetzt diese Indirektion.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Fonctionnalité en attente — désactivée. Nommera le sujet que le planificateur relit au moment du déclenchement, pour que le job travaille sur l''état COURANT plutôt que sur le payload de l''événement (potentiellement obsolète) ; le moteur de workflow remplacera cette indirection.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Capacidad pendiente — deshabilitada. Nombrará el asunto que el planificador relee en el momento del disparo, para que el job trabaje sobre el estado ACTUAL en lugar del payload del evento (potencialmente obsoleto); el motor de workflow reemplazará esta indirección.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Capacidade pendente — desabilitada. Nomeará o assunto que o agendador relê no momento do disparo, para que o job trabalhe sobre o estado ATUAL em vez do payload do evento (potencialmente obsoleto); o motor de workflow substituirá essa indireção.', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.entities.job_rule.hints.source_subject' AND language = 'pt-PT' AND deleted_at IS NULL;

-- ── emitted-event display name (EmitDecl.label_key) ────────────────────
-- INSERT is idempotent (ON CONFLICT … DO NOTHING) so a retry after a
-- partial apply cannot collide on the (key, language) live unique index.
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('job.events.rules_changed.name', 'en-GB', 'Rules changed', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'en-US', 'Rules changed', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'it-IT', 'Regole modificate', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'de-DE', 'Regeln geändert', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'fr-FR', 'Règles modifiées', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'es-ES', 'Reglas modificadas', now(), 'initial-setup', now(), 'initial-setup', 1),
  ('job.events.rules_changed.name', 'pt-PT', 'Regras alteradas', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ── page subtitle removed — soft-delete the unused key ─────────────────
UPDATE job.translations
SET deleted_at = now(), updated_by = 'migration-semantic-labels'
WHERE key = 'job.jobs.ruleForm.desc' AND deleted_at IS NULL;

-- ── "job" → "processo" in it-IT where the surface names the object ──────
UPDATE job.translations
SET value = 'Nuova regola processo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.jobs.ruleForm.title' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Regole processo', updated_at = now(), updated_by = 'migration-semantic-labels', version = version + 1
WHERE key = 'job.jobs.nav_rules' AND language = 'it-IT' AND deleted_at IS NULL;

-- job_trigger virtual-column labels + hints: runs (1:N link), last_run,
-- next_run, run_stats sparkline. Keys follow the `job.entities.<entity>.
-- fields|hints.<col>` convention — seven languages each.

BEGIN;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.fields.runs', 'en-GB', 'Runs', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'en-US', 'Runs', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'it-IT', 'Esecuzioni', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'de-DE', 'Läufe', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'fr-FR', 'Exécutions', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'es-ES', 'Ejecuciones', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.runs', 'pt-PT', 'Execuções', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.fields.last_run', 'en-GB', 'Last Run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'en-US', 'Last Run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'it-IT', 'Ultima esecuzione', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'de-DE', 'Letzter Lauf', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'fr-FR', 'Dernière exécution', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'es-ES', 'Última ejecución', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.last_run', 'pt-PT', 'Última execução', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.fields.next_run', 'en-GB', 'Next Run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'en-US', 'Next Run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'it-IT', 'Prossima esecuzione', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'de-DE', 'Nächster Lauf', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'fr-FR', 'Prochaine exécution', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'es-ES', 'Próxima ejecución', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.next_run', 'pt-PT', 'Próxima execução', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.fields.run_stats', 'en-GB', 'Run Stats', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'en-US', 'Run Stats', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'it-IT', 'Statistiche esecuzioni', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'de-DE', 'Laufstatistik', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'fr-FR', 'Statistiques', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'es-ES', 'Estadísticas', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.fields.run_stats', 'pt-PT', 'Estatísticas', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- hints (tooltip body + title)
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.hints.last_run', 'en-GB', 'When this trigger last produced a run.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'en-US', 'When this trigger last produced a run.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'it-IT', 'Quando questo trigger ha prodotto l''ultima esecuzione.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'de-DE', 'Wann dieser Trigger zuletzt einen Lauf erzeugt hat.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'fr-FR', 'Quand ce déclencheur a produit sa dernière exécution.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'es-ES', 'Cuándo este trigger produjo su última ejecución.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run', 'pt-PT', 'Quando este trigger produziu a última execução.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.hints.next_run', 'en-GB', 'Next scheduled fire of the armed trigger. Empty when disarmed, event-only, or cron-based.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'en-US', 'Next scheduled fire of the armed trigger. Empty when disarmed, event-only, or cron-based.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'it-IT', 'Prossimo avvio pianificato del trigger armato. Vuoto se disarmato, solo evento o basato su cron.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'de-DE', 'Nächste geplante Auslösung des aktivierten Triggers. Leer bei deaktiviertem, reinem Event- oder Cron-Trigger.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'fr-FR', 'Prochain déclenchement planifié du déclencheur armé. Vide si désarmé, événement seul ou cron.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'es-ES', 'Próximo disparo programado del trigger armado. Vacío si está desarmado, solo por evento o basado en cron.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run', 'pt-PT', 'Próximo disparo agendado do trigger armado. Vazio se desarmado, apenas por evento ou baseado em cron.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.hints.last_run_title', 'en-GB', 'Last run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'en-US', 'Last run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'it-IT', 'Ultima esecuzione', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'de-DE', 'Letzter Lauf', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'fr-FR', 'Dernière exécution', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'es-ES', 'Última ejecución', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.last_run_title', 'pt-PT', 'Última execução', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_trigger.hints.next_run_title', 'en-GB', 'Next run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'en-US', 'Next run', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'it-IT', 'Prossima esecuzione', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'de-DE', 'Nächster Lauf', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'fr-FR', 'Prochaine exécution', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'es-ES', 'Próxima ejecución', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_trigger.hints.next_run_title', 'pt-PT', 'Próxima execução', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

COMMIT;

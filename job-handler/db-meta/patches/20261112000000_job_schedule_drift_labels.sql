-- schedule-drift surface: live/drift column labels + badge value labels
-- (stale/missing/fired/expired) + `reconcile_interval_ms` config seed.
-- First job.config_entries row — boot + periodic reconcile read this key.
INSERT INTO job.config_entries (key, value, type, type_config, label_key, description_key, reserved, group_key, created_at, created_by, updated_at, updated_by, version)
VALUES ('reconcile_interval_ms', '300000', 'number', '{"min":0,"max":86400000}', 'job.config.reconcile_interval_ms.label', 'job.config.reconcile_interval_ms.description', false, 'jobs', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.fields.live', 'en-GB', 'Live', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'en-US', 'Live', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'it-IT', 'Attiva', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'de-DE', 'Aktiv', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'fr-FR', 'Active', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'es-ES', 'Activa', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.live', 'pt-PT', 'Ativa', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.fields.drift', 'en-GB', 'Drift', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'en-US', 'Drift', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'it-IT', 'Deriva', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'de-DE', 'Abweichung', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'fr-FR', 'Dérive', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'es-ES', 'Desviación', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.fields.drift', 'pt-PT', 'Desvio', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.stale', 'en-GB', 'Stale', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'en-US', 'Stale', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'it-IT', 'Obsoleta', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'de-DE', 'Veraltet', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'fr-FR', 'Obsolète', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'es-ES', 'Obsoleta', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stale', 'pt-PT', 'Obsoleta', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.missing', 'en-GB', 'Missing', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'en-US', 'Missing', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'it-IT', 'Mancante', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'de-DE', 'Fehlend', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'fr-FR', 'Manquant', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'es-ES', 'Ausente', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.missing', 'pt-PT', 'Em falta', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.fired', 'en-GB', 'Fired', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'en-US', 'Fired', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'it-IT', 'Eseguita', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'de-DE', 'Ausgelöst', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'fr-FR', 'Déclenchée', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'es-ES', 'Ejecutada', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.fired', 'pt-PT', 'Disparada', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.expired', 'en-GB', 'Expired', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'en-US', 'Expired', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'it-IT', 'Scaduta', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'de-DE', 'Abgelaufen', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'fr-FR', 'Expirée', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'es-ES', 'Expirada', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.expired', 'pt-PT', 'Expirada', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.config.reconcile_interval_ms.label', 'en-GB', 'Schedule reconcile interval', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'en-US', 'Schedule reconcile interval', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'it-IT', 'Intervallo riconciliazione schedule', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'de-DE', 'Abgleichsintervall der Zeitpläne', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'fr-FR', 'Intervalle de réconciliation des planifications', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'es-ES', 'Intervalo de reconciliación de programaciones', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.label', 'pt-PT', 'Intervalo de reconciliação de agendamentos', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.config.reconcile_interval_ms.description', 'en-GB', 'How often the schedule registry is reconciled against live NATS declarations, in milliseconds. 0 disables the periodic run — boot-time reconcile always runs.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'en-US', 'How often the schedule registry is reconciled against live NATS declarations, in milliseconds. 0 disables the periodic run — boot-time reconcile always runs.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'it-IT', 'Ogni quanto il registro schedule viene riconciliato con le dichiarazioni NATS attive, in millisecondi. 0 disabilita il run periodico — la riconciliazione al boot resta sempre attiva.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'de-DE', 'Wie oft die Zeitplan-Registry mit den aktiven NATS-Deklarationen abgeglichen wird, in Millisekunden. 0 deaktiviert den periodischen Lauf — der Boot-Abgleich läuft immer.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'fr-FR', 'Fréquence à laquelle le registre des planifications est réconcilié avec les déclarations NATS actives, en millisecondes. 0 désactive le cycle périodique — la réconciliation au démarrage s''exécute toujours.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'es-ES', 'Cada cuánto se reconcilia el registro de programaciones con las declaraciones NATS activas, en milisegundos. 0 desactiva el ciclo periódico — la reconciliación de arranque siempre se ejecuta.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.config.reconcile_interval_ms.description', 'pt-PT', 'Com que frequência o registo de agendamentos é reconciliado com as declarações NATS ativas, em milissegundos. 0 desativa o ciclo periódico — a reconciliação no arranque executa sempre.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

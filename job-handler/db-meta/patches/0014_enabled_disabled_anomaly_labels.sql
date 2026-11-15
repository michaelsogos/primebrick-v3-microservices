-- Primebrick: align schedule lifecycle vocabulary with the actions.
--
-- The disable/enable actions own the semantics — the labels must speak
-- the same language: `live` (NATS truth column) and `status=armed` read
-- "Enabled", `status=disarmed` reads "Disabled". `drift` (mirror↔NATS
-- divergence) is renamed "Anomaly" — "Deriva/Drift" was wire jargon.
-- Timestamp columns follow the same family.

UPDATE job.translations SET value = 'Enabled'      WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'en-GB';
UPDATE job.translations SET value = 'Enabled'      WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'en-US';
UPDATE job.translations SET value = 'Abilitata'    WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'it-IT';
UPDATE job.translations SET value = 'Activée'      WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'fr-FR';
UPDATE job.translations SET value = 'Habilitada'   WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'es-ES';
UPDATE job.translations SET value = 'Aktiviert'    WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'de-DE';
UPDATE job.translations SET value = 'Ativada'      WHERE key = 'job.entities.job_schedule.fields.live'  AND language = 'pt-PT';

UPDATE job.translations SET value = 'Enabled'      WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'en-GB';
UPDATE job.translations SET value = 'Enabled'      WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'en-US';
UPDATE job.translations SET value = 'Abilitata'    WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'it-IT';
UPDATE job.translations SET value = 'Activée'      WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Habilitada'   WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'es-ES';
UPDATE job.translations SET value = 'Aktiviert'    WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'de-DE';
UPDATE job.translations SET value = 'Ativada'      WHERE key = 'job.entities.job_schedule.status.armed' AND language = 'pt-PT';

UPDATE job.translations SET value = 'Disabled'     WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'en-GB';
UPDATE job.translations SET value = 'Disabled'     WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'en-US';
UPDATE job.translations SET value = 'Disabilitata' WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'it-IT';
UPDATE job.translations SET value = 'Désactivée'   WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Deshabilitada' WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'es-ES';
UPDATE job.translations SET value = 'Deaktiviert'  WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'de-DE';
UPDATE job.translations SET value = 'Desativada'   WHERE key = 'job.entities.job_schedule.status.disarmed' AND language = 'pt-PT';

UPDATE job.translations SET value = 'Anomaly'      WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'en-GB';
UPDATE job.translations SET value = 'Anomaly'      WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'en-US';
UPDATE job.translations SET value = 'Anomalia'     WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'it-IT';
UPDATE job.translations SET value = 'Anomalie'     WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Anomalía'     WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'es-ES';
UPDATE job.translations SET value = 'Anomalie'     WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'de-DE';
UPDATE job.translations SET value = 'Anomalia'     WHERE key = 'job.entities.job_schedule.fields.drift' AND language = 'pt-PT';

UPDATE job.translations SET value = 'Enabled at'   WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'en-GB';
UPDATE job.translations SET value = 'Enabled at'   WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'en-US';
UPDATE job.translations SET value = 'Abilitata il' WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'it-IT';
UPDATE job.translations SET value = 'Activée le'   WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Habilitada el' WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'es-ES';
UPDATE job.translations SET value = 'Aktiviert am' WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'de-DE';
UPDATE job.translations SET value = 'Ativada em'   WHERE key = 'job.entities.job_schedule.fields.armed_at' AND language = 'pt-PT';

UPDATE job.translations SET value = 'Disabled at'  WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'en-GB';
UPDATE job.translations SET value = 'Disabled at'  WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'en-US';
UPDATE job.translations SET value = 'Disabilitata il' WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'it-IT';
UPDATE job.translations SET value = 'Désactivée le' WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Deshabilitada el' WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'es-ES';
UPDATE job.translations SET value = 'Deaktiviert am' WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'de-DE';
UPDATE job.translations SET value = 'Desativada em' WHERE key = 'job.entities.job_schedule.fields.disarmed_at' AND language = 'pt-PT';

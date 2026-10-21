-- Primebrick: Job module — unified schedules section title.
--
-- The /system/jobs page now renders ONE job_schedule table whose scope is
-- driven by the `schedule_kind` filter preset (patch 0007 seeded its keys),
-- replacing the recurring/once split sections. The `runs` section stays;
-- rules moved to the host-rendered /system/jobs/rules page.

INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.jobs.sections.schedules', 'en-GB', 'Schedules', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'en-US', 'Schedules', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'it-IT', 'Schedulazioni', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'de-DE', 'Zeitpläne', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'fr-FR', 'Planifications', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'es-ES', 'Programaciones', 'initial-setup', 'initial-setup'),
  ('job.jobs.sections.schedules', 'pt-PT', 'Agendamentos', 'initial-setup', 'initial-setup');

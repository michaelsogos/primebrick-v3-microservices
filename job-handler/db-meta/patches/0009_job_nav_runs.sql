-- Primebrick: Job module — "Runs" nav link label.
--
-- The job module moved to its own /jobs prefix with three standard list
-- pages (/jobs schedules, /jobs/runs, /jobs/rules) plus the remote
-- /jobs/new schedule form. The runs page needs its own nav label.

INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.jobs.nav_runs', 'en-GB', 'Runs', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'en-US', 'Runs', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'it-IT', 'Esecuzioni', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'de-DE', 'Ausführungen', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'fr-FR', 'Exécutions', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'es-ES', 'Ejecuciones', 'initial-setup', 'initial-setup'),
  ('job.jobs.nav_runs', 'pt-PT', 'Execuções', 'initial-setup', 'initial-setup');

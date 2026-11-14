-- Primebrick: schedule identity = the scheduled job's name.
--
-- `armed_by` (calculated) is replaced by `job_name` — the schedule
-- inherits the name of the job it schedules, mirroring `job_run.job_name`
-- semantics: the owning trigger's name for trigger mirrors, the declared
-- subject tail for manual/infra declarations. The label re-uses the same
-- "Job Name" family already seeded for job_run.
--
-- `fields.armed_by` keys are KEPT: they relabel the `created_by` audit
-- column — the honest "who armed it" surface (trigger:<name> stamps,
-- user display_name, service code).

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'en-GB', 'Job Name', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'en-US', 'Job Name', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'it-IT', 'Nome Processo', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'fr-FR', 'Nom du job', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'es-ES', 'Nombre del job', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'de-DE', 'Jobname', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1),
  (uuidv7(), 'job.entities.job_schedule.fields.job_name', 'pt-PT', 'Nome do job', now(), 'migration-job-name-label', now(), 'migration-job-name-label', 1);

-- 0014_job_schedules_page_label — retitle the schedules page.
--
-- The job module's main list moved from the singular module root
-- (/system/job) to the plural entity page (/system/job/job-schedules) as
-- part of the route-convention enforcement: list routes end in a plural
-- leaf and the page is "Job Schedules", not "Jobs". `job.jobs.nav` /
-- `job.jobs.title` are the page's display strings — values updated in all
-- 7 shipped languages; keys unchanged (the `job.jobs.*` namespace covers
-- the whole module's page surface).
--
-- it-IT intentionally breaks the "… job" suffix pattern: the user's
-- canonical wording is "Pianificazioni [dei Lavori]" — never "Job(s)".

UPDATE job.translations
SET value = 'Job Schedules', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key IN ('job.jobs.nav', 'job.jobs.title') AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Pianificazioni', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key = 'job.jobs.nav' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE job.translations
SET value = 'Pianificazioni dei Lavori', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key = 'job.jobs.title' AND language = 'it-IT' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Job-Zeitpläne', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key IN ('job.jobs.nav', 'job.jobs.title') AND language = 'de-DE' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Planifications de job', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key IN ('job.jobs.nav', 'job.jobs.title') AND language = 'fr-FR' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Programaciones de job', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key IN ('job.jobs.nav', 'job.jobs.title') AND language = 'es-ES' AND deleted_at IS NULL;

UPDATE job.translations
SET value = 'Agendamentos de job', updated_at = now(), updated_by = 'migration-0014', version = version + 1
WHERE key IN ('job.jobs.nav', 'job.jobs.title') AND language = 'pt-PT' AND deleted_at IS NULL;

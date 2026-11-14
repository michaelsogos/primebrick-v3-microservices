-- Primebrick: retire the `manual` schedule kind from the served vocabulary.
--
-- `manual` has no producer left: `jobs.ctl.schedule.request` declares only
-- `infra_derived`, and schedule-only triggers absorbed the user-facing
-- "create a timer" flow (engine emits `trigger`). The badge value was
-- dropped from jobScheduleMeta in the same change; this patch removes the
-- orphaned label family so the kind domain reads infra_derived|trigger
-- end-to-end.

DELETE FROM job.translations
 WHERE key = 'job.entities.job_schedule.status.manual';

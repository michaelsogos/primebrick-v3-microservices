-- Primebrick: schedule_spec label collision fix.
--
-- `job_schedule.schedule_subject` and `job_schedule.schedule_spec` shipped
-- the same label ("Pianificazione"/"Schedule"/…) in all 7 languages — two
-- different columns rendering one name in the list + column picker.
-- schedule_subject keeps the title-column label (it IS the schedule's
-- identity subject); schedule_spec — the human cadence text ("Ogni 1 ora",
-- "Una volta il …") — gets its own cadence label.

UPDATE job.translations SET value = 'Cadence', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'en-GB';
UPDATE job.translations SET value = 'Cadence', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'en-US';
UPDATE job.translations SET value = 'Cadenza', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'it-IT';
UPDATE job.translations SET value = 'Cadence', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'fr-FR';
UPDATE job.translations SET value = 'Cadencia', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'es-ES';
UPDATE job.translations SET value = 'Kadenz', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'de-DE';
UPDATE job.translations SET value = 'Cadência', updated_at = now(), updated_by = 'migration-schedule-spec-label', version = version + 1
  WHERE key = 'job.entities.job_schedule.fields.schedule_spec' AND language = 'pt-PT';

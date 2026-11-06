-- 20261120000000 — job_trigger CTA/form title → Title Case.
--
-- `job.jobs.triggerForm.title` is mirrored verbatim by the ELT toolbar NEW
-- CTA (census kind:"create" route label_key) and heads the create/detail
-- form. CTA labels use Title Case — align every language.
-- en-GB/en-US ('New Job Trigger') and de-DE ('Neuer Job-Trigger') are
-- already Title Case; the others move word order/capitalisation to match.

UPDATE job.translations SET value='Nuovo Trigger Job', updated_at=now(), updated_by='migration-trigger-title-case', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Nouveau Déclencheur de Job', updated_at=now(), updated_by='migration-trigger-title-case', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Nuevo Trigger de Job', updated_at=now(), updated_by='migration-trigger-title-case', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Novo Trigger de Job', updated_at=now(), updated_by='migration-trigger-title-case', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='pt-PT' AND deleted_at IS NULL;

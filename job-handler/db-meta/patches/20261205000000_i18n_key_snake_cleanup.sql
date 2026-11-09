-- i18n key snake_case cleanup — job own-schema renames + CHECK
-- tx:
-- === job.translations renames ===
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.arm' WHERE "key" = 'job.jobs.scheduleDialog.arm';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.desc' WHERE "key" = 'job.jobs.scheduleDialog.desc';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.lane' WHERE "key" = 'job.jobs.scheduleDialog.lane';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.name' WHERE "key" = 'job.jobs.scheduleDialog.name';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.preview' WHERE "key" = 'job.jobs.scheduleDialog.preview';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.spec' WHERE "key" = 'job.jobs.scheduleDialog.spec';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.target_action' WHERE "key" = 'job.jobs.scheduleDialog.targetAction';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.target_service' WHERE "key" = 'job.jobs.scheduleDialog.targetService';
UPDATE job.translations SET "key" = 'job.jobs.schedule_dialog.title' WHERE "key" = 'job.jobs.scheduleDialog.title';
UPDATE job.translations SET "key" = 'job.jobs.schedule_new' WHERE "key" = 'job.jobs.scheduleNew';
UPDATE job.translations SET "key" = 'job.jobs.scheduled_ok' WHERE "key" = 'job.jobs.scheduledOk';
UPDATE job.translations SET "key" = 'job.jobs.trigger_form.create' WHERE "key" = 'job.jobs.triggerForm.create';
UPDATE job.translations SET "key" = 'job.jobs.trigger_form.created' WHERE "key" = 'job.jobs.triggerForm.created';
UPDATE job.translations SET "key" = 'job.jobs.trigger_form.desc' WHERE "key" = 'job.jobs.triggerForm.desc';
UPDATE job.translations SET "key" = 'job.jobs.trigger_form.title' WHERE "key" = 'job.jobs.triggerForm.title';
ALTER TABLE job.translations ADD CONSTRAINT translations_key_shape CHECK ("key" ~ '^job(\.[a-z0-9_]+)+$');
-- /tx

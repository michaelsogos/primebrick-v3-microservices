-- i18n key snake_case cleanup — emailsender own-schema renames + CHECK
-- tx:
-- === emailsender.translations renames ===
UPDATE emailsender.translations SET "key" = 'emailsender.callable.send.language_iso' WHERE "key" = 'emailsender.callable.send.languageIso';
UPDATE emailsender.translations SET "key" = 'emailsender.callable.send.template_code' WHERE "key" = 'emailsender.callable.send.templateCode';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.add_provider' WHERE "key" = 'emailsender.providers.addProvider';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.api_endpoint' WHERE "key" = 'emailsender.providers.apiEndpoint';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.api_key' WHERE "key" = 'emailsender.providers.apiKey';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.api_key_leave_blank' WHERE "key" = 'emailsender.providers.apiKeyLeaveBlank';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.confirm_delete' WHERE "key" = 'emailsender.providers.confirmDelete';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.create_provider' WHERE "key" = 'emailsender.providers.createProvider';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.edit_provider' WHERE "key" = 'emailsender.providers.editProvider';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.errors.api_key_required' WHERE "key" = 'emailsender.providers.errors.apiKeyRequired';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.errors.invalid_email' WHERE "key" = 'emailsender.providers.errors.invalidEmail';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.errors.provider_required' WHERE "key" = 'emailsender.providers.errors.providerRequired';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.from_email' WHERE "key" = 'emailsender.providers.fromEmail';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.from_name' WHERE "key" = 'emailsender.providers.fromName';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.no_providers' WHERE "key" = 'emailsender.providers.noProviders';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.provider_name' WHERE "key" = 'emailsender.providers.providerName';
UPDATE emailsender.translations SET "key" = 'emailsender.providers.reply_to' WHERE "key" = 'emailsender.providers.replyTo';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.body_html' WHERE "key" = 'emailsender.templates.bodyHtml';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.body_text' WHERE "key" = 'emailsender.templates.bodyText';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.create_template' WHERE "key" = 'emailsender.templates.createTemplate';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.edit_template' WHERE "key" = 'emailsender.templates.editTemplate';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.errors.code_required' WHERE "key" = 'emailsender.templates.errors.codeRequired';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.errors.invalid_variables_json' WHERE "key" = 'emailsender.templates.errors.invalidVariablesJson';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.errors.language_required' WHERE "key" = 'emailsender.templates.errors.languageRequired';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.language_iso' WHERE "key" = 'emailsender.templates.languageIso';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.mjml_source' WHERE "key" = 'emailsender.templates.mjmlSource';
UPDATE emailsender.translations SET "key" = 'emailsender.templates.variables_hint' WHERE "key" = 'emailsender.templates.variablesHint';
ALTER TABLE emailsender.translations ADD CONSTRAINT translations_key_shape CHECK ("key" ~ '^emailsender(\.[a-z0-9_]+)+$');
-- /tx

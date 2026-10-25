-- End-user display names — "Email Sender" was the technical service name,
-- not a product surface. Leaf labels get meaningful names too ("Provider
-- email" → the services it configures, "Template" → Email Templates).

UPDATE emailsender.translations SET value = 'Gestore delle Email', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Manager', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Gestionnaire des e-mails', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Gestor de correos electrónicos', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'E-Mail-Verwaltung', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Gestor de e-mails', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.module.name' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE emailsender.translations SET value = 'Servizi di Invio Email', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Delivery Services', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Delivery Services', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Services d''envoi d''e-mails', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Servicios de envío de correo', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'E-Mail-Versanddienste', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Serviços de envio de e-mail', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.providers' AND language = 'pt-PT' AND deleted_at IS NULL;

UPDATE emailsender.translations SET value = 'Modelli Email', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Templates', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'en-GB' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Email Templates', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'en-US' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Modèles d''e-mails', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Plantillas de correo', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'E-Mail-Vorlagen', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE emailsender.translations SET value = 'Modelos de e-mail', updated_at = now(), updated_by = 'migration-enduser-names', version = version + 1 WHERE key = 'emailsender.nav.templates' AND language = 'pt-PT' AND deleted_at IS NULL;

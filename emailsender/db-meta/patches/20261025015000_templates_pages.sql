-- Primebrick Emailsender: email_template pages — i18n seeds.
--
-- The email_templates entity gains its module-owned surfaces
-- (`/system/emailsender/templates{,/create,/[uuid]}` — host-rendered
-- EntityTablePage list + remote create/edit forms). This patch seeds the
-- NEW vocabulary in the module-owned namespace (nothing is moved — the
-- legacy `system.settings.templates.*` keys belong to a different,
-- document-template feature that was never implemented):
--
--   1. `emailsender.nav.templates` — the module nav leaf label.
--   2. `emailsender.entities.email_template.*` — entity labels for the
--      host-rendered EntityTablePage (title/singular/plural/fields.*),
--      `<ns>.entities.<entity>.*` convention (job.entities.* precedent).
--   3. `emailsender.templates.*` — remote form vocabulary (field labels,
--      actions, validation errors, notifications).
--
-- All keys live in emailsender.translations — the namespace write
-- boundary accepts only `emailsender.*` writes from this module.

-- ─── 1. Nav leaf label ───────────────────────────────────────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.nav.templates', 'de-DE', 'Vorlagen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'en-GB', 'Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'en-US', 'Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'es-ES', 'Plantillas', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'fr-FR', 'Modèles', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'it-IT', 'Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.nav.templates', 'pt-PT', 'Modelos', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── 2. Entity labels (title/singular/plural/fields.*) ───────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.entities.email_template.title', 'de-DE', 'E-Mail-Vorlagen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'en-GB', 'Email Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'en-US', 'Email Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'es-ES', 'Plantillas de correo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'fr-FR', 'Modèles d''email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'it-IT', 'Template email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.title', 'pt-PT', 'Modelos de email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.singular', 'de-DE', 'E-Mail-Vorlage', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'en-GB', 'Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'en-US', 'Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'es-ES', 'Plantilla de correo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'fr-FR', 'Modèle d''email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'it-IT', 'Template email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.singular', 'pt-PT', 'Modelo de email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.plural', 'de-DE', 'E-Mail-Vorlagen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'en-GB', 'Email Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'en-US', 'Email Templates', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'es-ES', 'Plantillas de correo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'fr-FR', 'Modèles d''email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'it-IT', 'Template email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.plural', 'pt-PT', 'Modelos de email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.fields.code', 'de-DE', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'en-GB', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'en-US', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'es-ES', 'Código', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'fr-FR', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'it-IT', 'Codice', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.code', 'pt-PT', 'Código', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.fields.language_iso', 'de-DE', 'Sprache', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'en-GB', 'Language', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'en-US', 'Language', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'es-ES', 'Idioma', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'fr-FR', 'Langue', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'it-IT', 'Lingua', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.language_iso', 'pt-PT', 'Idioma', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.fields.subject', 'de-DE', 'Betreff', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'en-GB', 'Subject', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'en-US', 'Subject', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'es-ES', 'Asunto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'fr-FR', 'Objet', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'it-IT', 'Oggetto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.subject', 'pt-PT', 'Assunto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.fields.updated_at', 'de-DE', 'Aktualisiert am', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'en-GB', 'Updated at', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'en-US', 'Updated at', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'es-ES', 'Actualizada el', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'fr-FR', 'Mise à jour le', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'it-IT', 'Aggiornata il', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.updated_at', 'pt-PT', 'Atualizada em', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.entities.email_template.fields.created_at', 'de-DE', 'Erstellt am', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'en-GB', 'Created at', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'en-US', 'Created at', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'es-ES', 'Creada el', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'fr-FR', 'Créée le', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'it-IT', 'Creata il', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.entities.email_template.fields.created_at', 'pt-PT', 'Criada em', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── 3. Remote form vocabulary (emailsender.templates.*) ─────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.templates.createTemplate', 'de-DE', 'E-Mail-Vorlage erstellen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'en-GB', 'Create Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'en-US', 'Create Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'es-ES', 'Crear plantilla de correo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'fr-FR', 'Créer un modèle d''email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'it-IT', 'Crea template email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.createTemplate', 'pt-PT', 'Criar modelo de email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.editTemplate', 'de-DE', 'E-Mail-Vorlage bearbeiten', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'en-GB', 'Edit Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'en-US', 'Edit Email Template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'es-ES', 'Editar plantilla de correo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'fr-FR', 'Modifier le modèle d''email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'it-IT', 'Modifica template email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.editTemplate', 'pt-PT', 'Editar modelo de email', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.code', 'de-DE', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'en-GB', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'en-US', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'es-ES', 'Código', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'fr-FR', 'Code', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'it-IT', 'Codice', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.code', 'pt-PT', 'Código', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.languageIso', 'de-DE', 'Sprache', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'en-GB', 'Language', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'en-US', 'Language', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'es-ES', 'Idioma', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'fr-FR', 'Langue', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'it-IT', 'Lingua', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.languageIso', 'pt-PT', 'Idioma', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.subject', 'de-DE', 'Betreff', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'en-GB', 'Subject', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'en-US', 'Subject', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'es-ES', 'Asunto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'fr-FR', 'Objet', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'it-IT', 'Oggetto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.subject', 'pt-PT', 'Assunto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.mjmlSource', 'de-DE', 'MJML-Quelle', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'en-GB', 'MJML Source', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'en-US', 'MJML Source', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'es-ES', 'Fuente MJML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'fr-FR', 'Source MJML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'it-IT', 'Sorgente MJML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.mjmlSource', 'pt-PT', 'Fonte MJML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.bodyHtml', 'de-DE', 'HTML-Text', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'en-GB', 'HTML Body', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'en-US', 'HTML Body', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'es-ES', 'Cuerpo HTML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'fr-FR', 'Corps HTML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'it-IT', 'Corpo HTML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyHtml', 'pt-PT', 'Corpo HTML', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.bodyText', 'de-DE', 'Nur-Text', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'en-GB', 'Plain Text Body', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'en-US', 'Plain Text Body', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'es-ES', 'Cuerpo de texto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'fr-FR', 'Corps texte brut', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'it-IT', 'Corpo testo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.bodyText', 'pt-PT', 'Corpo de texto', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.variables', 'de-DE', 'Variablen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'en-GB', 'Variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'en-US', 'Variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'es-ES', 'Variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'fr-FR', 'Variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'it-IT', 'Variabili', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variables', 'pt-PT', 'Variáveis', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.variablesHint', 'de-DE', 'Optionales JSON-Objekt mit den Variablen der Vorlage', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'en-GB', 'Optional JSON object with the template''s variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'en-US', 'Optional JSON object with the template''s variables', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'es-ES', 'Objeto JSON opcional con las variables de la plantilla', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'fr-FR', 'Objet JSON optionnel avec les variables du modèle', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'it-IT', 'Oggetto JSON opzionale con le variabili del template', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.variablesHint', 'pt-PT', 'Objeto JSON opcional com as variáveis do modelo', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.cancel', 'de-DE', 'Abbrechen', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'en-GB', 'Cancel', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'en-US', 'Cancel', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'es-ES', 'Cancelar', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'fr-FR', 'Annuler', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'it-IT', 'Annulla', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.cancel', 'pt-PT', 'Cancelar', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.save', 'de-DE', 'Speichern', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'en-GB', 'Save', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'en-US', 'Save', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'es-ES', 'Guardar', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'fr-FR', 'Enregistrer', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'it-IT', 'Salva', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.save', 'pt-PT', 'Guardar', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.errors.codeRequired', 'de-DE', 'Code ist erforderlich', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'en-GB', 'Code is required', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'en-US', 'Code is required', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'es-ES', 'El código es obligatorio', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'fr-FR', 'Le code est obligatoire', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'it-IT', 'Il codice è obbligatorio', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.codeRequired', 'pt-PT', 'O código é obrigatório', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.errors.languageRequired', 'de-DE', 'Sprache ist erforderlich', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'en-GB', 'Language is required', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'en-US', 'Language is required', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'es-ES', 'El idioma es obligatorio', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'fr-FR', 'La langue est obligatoire', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'it-IT', 'La lingua è obbligatoria', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.languageRequired', 'pt-PT', 'O idioma é obrigatório', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.errors.invalidVariablesJson', 'de-DE', 'Variablen müssen ein gültiges JSON-Objekt sein', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'en-GB', 'Variables must be a valid JSON object', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'en-US', 'Variables must be a valid JSON object', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'es-ES', 'Las variables deben ser un objeto JSON válido', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'fr-FR', 'Les variables doivent être un objet JSON valide', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'it-IT', 'Le variabili devono essere un oggetto JSON valido', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.errors.invalidVariablesJson', 'pt-PT', 'As variáveis devem ser um objeto JSON válido', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.notifications.created', 'de-DE', 'Vorlage erstellt', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'en-GB', 'Template created', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'en-US', 'Template created', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'es-ES', 'Plantilla creada', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'fr-FR', 'Modèle créé', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'it-IT', 'Template creato', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.created', 'pt-PT', 'Modelo criado', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),

  ('emailsender.templates.notifications.updated', 'de-DE', 'Vorlage aktualisiert', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'en-GB', 'Template updated', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'en-US', 'Template updated', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'es-ES', 'Plantilla actualizada', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'fr-FR', 'Modèle mis à jour', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'it-IT', 'Template aggiornato', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1),
  ('emailsender.templates.notifications.updated', 'pt-PT', 'Modelo atualizado', now(), 'migration-emailsender-templates-pages', now(), 'migration-emailsender-templates-pages', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

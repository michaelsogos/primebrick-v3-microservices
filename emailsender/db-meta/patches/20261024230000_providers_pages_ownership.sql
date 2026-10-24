-- Primebrick Emailsender: providers page/module ownership — i18n move.
--
-- The provider admin surfaces migrate from the settings shell module
-- (`/system/settings/email-providers`, hand-rolled page) to the emailsender
-- service module (`/system/emailsender/providers{,/create,/[uuid]}`, census-
-- declared). This patch performs the LIVE ownership moves:
--
--   1. Form vocabulary — system.translations → emailsender.translations:
--        system.settings.emailProviders.*  → emailsender.providers.*
--      (22 keys × 7 languages; leaf names preserved verbatim).
--   2. Nav label — the settings tab key becomes the module nav label:
--        system.settings.tabs.emailProviders → emailsender.nav.providers
--   3. `emailsender.module.name` — the module's OWN display-name key,
--      referenced by service_registry.label_key (`job.module.name`
--      precedent). "Email Sender" is the registry product name — identical
--      in all 7 languages.
--   4. `emailsender.entities.provider.*` — entity-label vocabulary for the
--      host-rendered EntityTablePage (title/singular/plural/fields.*), in
--      the module-owned `<ns>.entities.<entity>.*` shape (job.entities.*
--      precedent). Field labels reuse the moved form vocabulary where the
--      wording is identical; audit-column labels reuse the canonical
--      created_at/updated_at strings already shipped for job entities.
--
-- INSERT…SELECT moves every seeded language in one pass; the source rows
-- are hard-deleted (module-owned keys live exactly once — ai 0008
-- precedent). No `emailsender.providers.*`/`emailsender.entities.*` keys
-- exist yet (emailsender.translations was empty — verified before
-- authoring), so the moves cannot collide on (key, language).

-- ─── 1. Form vocabulary move ─────────────────────────────────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.settings\.emailProviders\.', 'emailsender.providers.'), language, value,
       now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.settings.emailProviders.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── 2. Nav label move ───────────────────────────────────────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT 'emailsender.nav.providers', language, value,
       now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', version
FROM system.translations
WHERE key = 'system.settings.tabs.emailProviders' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── Source cleanup (keys live exactly once) ─────────────────────────────────

DELETE FROM system.translations
WHERE deleted_at IS NULL AND (
     key LIKE 'system.settings.emailProviders.%'
  OR key = 'system.settings.tabs.emailProviders'
);

-- ─── 3. Module display name ──────────────────────────────────────────────────

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.module.name', 'de-DE', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'en-GB', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'en-US', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'es-ES', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'fr-FR', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'it-IT', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.module.name', 'pt-PT', 'Email Sender', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── 4. Entity labels (title/singular/plural/fields.*) ───────────────────────
-- Field labels reuse the moved vocabulary's wording (providerName →
-- fields.provider, apiEndpoint → fields.api_endpoint, …). Audit columns
-- reuse the canonical strings already shipped for job entities.

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.entities.provider.title', 'de-DE', 'E-Mail-Anbieter', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'en-GB', 'Email Provider', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'en-US', 'Email Provider', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'es-ES', 'Proveedor de correo', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'fr-FR', 'Fournisseur d''email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'it-IT', 'Provider email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.title', 'pt-PT', 'Fornecedor de email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.singular', 'de-DE', 'E-Mail-Anbieter', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'en-GB', 'Email Provider', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'en-US', 'Email Provider', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'es-ES', 'Proveedor de correo', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'fr-FR', 'Fournisseur d''email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'it-IT', 'Provider email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.singular', 'pt-PT', 'Fornecedor de email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.plural', 'de-DE', 'E-Mail-Anbieter', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'en-GB', 'Email Providers', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'en-US', 'Email Providers', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'es-ES', 'Proveedores de correo', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'fr-FR', 'Fournisseurs d''email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'it-IT', 'Provider email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.plural', 'pt-PT', 'Fornecedores de email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.provider', 'de-DE', 'Anbietername', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'en-GB', 'Provider Name', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'en-US', 'Provider Name', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'es-ES', 'Nombre del proveedor', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'fr-FR', 'Nom du fournisseur', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'it-IT', 'Nome provider', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.provider', 'pt-PT', 'Nome do fornecedor', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.api_endpoint', 'de-DE', 'API-Endpunkt', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'en-GB', 'API Endpoint', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'en-US', 'API Endpoint', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'es-ES', 'Endpoint de API', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'fr-FR', 'Point de terminaison API', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'it-IT', 'Endpoint API', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.api_endpoint', 'pt-PT', 'Endpoint da API', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.from_email', 'de-DE', 'Absender-E-Mail', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'en-GB', 'From Email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'en-US', 'From Email', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'es-ES', 'Correo de origen', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'fr-FR', 'Email d''expédition', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'it-IT', 'Email mittente', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_email', 'pt-PT', 'Email de origem', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.from_name', 'de-DE', 'Absendername', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'en-GB', 'From Name', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'en-US', 'From Name', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'es-ES', 'Nombre de origen', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'fr-FR', 'Nom d''expédition', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'it-IT', 'Nome mittente', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.from_name', 'pt-PT', 'Nome de origem', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.reply_to', 'de-DE', 'Antwort an', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'en-GB', 'Reply To', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'en-US', 'Reply To', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'es-ES', 'Responder a', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'fr-FR', 'Répondre à', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'it-IT', 'Rispondi a', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.reply_to', 'pt-PT', 'Responder a', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.updated_at', 'de-DE', 'Aktualisiert am', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'en-GB', 'Updated at', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'en-US', 'Updated at', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'es-ES', 'Actualizada el', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'fr-FR', 'Mise à jour le', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'it-IT', 'Aggiornata il', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.updated_at', 'pt-PT', 'Atualizada em', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),

  ('emailsender.entities.provider.fields.created_at', 'de-DE', 'Erstellt am', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'en-GB', 'Created at', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'en-US', 'Created at', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'es-ES', 'Creada el', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'fr-FR', 'Créée le', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'it-IT', 'Creata il', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1),
  ('emailsender.entities.provider.fields.created_at', 'pt-PT', 'Criada em', now(), 'migration-emailsender-pages-ownership', now(), 'migration-emailsender-pages-ownership', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

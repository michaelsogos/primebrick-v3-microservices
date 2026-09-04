-- Primebrick: Emailsender translations table — DB is the sole source of truth for i18n.
-- The BE manages all CRUD for this schema via its central translations gateway.
-- One row per (key, language) pair. The key is the full dot-path
-- (e.g. 'emailsender.templates.welcome.subject').

CREATE TABLE IF NOT EXISTS emailsender.translations (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  key VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  deleted_by VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS emailsender_translations_key_language_uidx
  ON emailsender.translations (key, language)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS emailsender_translations_language_idx
  ON emailsender.translations (language)
  WHERE deleted_at IS NULL;

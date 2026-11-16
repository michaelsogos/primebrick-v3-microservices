-- Primebrick: Boilerplate infra — schema + translations table.
-- The translations table is NOT entity-managed (BE owns i18n writes via its
-- central translations gateway) — it is hand-written infra like in every
-- service. Every registered service owns `<code>.translations`; the table
-- must exist or the BE dict endpoint fails (TRANSLATIONS_SCHEMA_MISSING).

CREATE SCHEMA IF NOT EXISTS "boilerplate";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS boilerplate.translations (
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

CREATE UNIQUE INDEX IF NOT EXISTS boilerplate_translations_key_language_uidx
  ON boilerplate.translations (key, language)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS boilerplate_translations_language_idx
  ON boilerplate.translations (language)
  WHERE deleted_at IS NULL;

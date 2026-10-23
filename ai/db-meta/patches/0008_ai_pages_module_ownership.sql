-- Primebrick AI: module page ownership — ai.translations table + domain moves.
--
-- The AI pages migrate from the settings shell module to the ai service
-- (`/system/settings/ai` → `/system/ai`, docs-index → `/system/ai/docs-index`).
-- This patch performs the LIVE ownership moves:
--
--   1. ai.translations — the module-owned i18n table (BE translations gateway
--      discovers it via service_registry code → `<code>.translations`).
--   2. Translation keys move system.translations → ai.translations:
--        system.settings.ai.*                        → ai.console.*
--        system.settings.docsIndex.*                 → ai.docs.*
--        system.settings.tabs.ai                     → ai.nav
--        system.settings.tabs.docsIndex              → ai.nav.docs_index
--        system.settings.config.auth.ai_assistant_model.* → ai.config.ai_assistant_model.*
--        system.entities.ai_model.*                  → ai.entities.ai_model.*
--        system.entities.ai_cerebellum.*             → ai.entities.ai_cerebellum.*
--      INSERT…SELECT moves every seeded language in one pass; the source
--      rows are hard-deleted (module-owned keys live exactly once).
--   3. `ai.module.name` — the module label_key (job/crm `<code>.module.name`
--      precedent), seeded from the moved tabs.ai values.
--   4. Config ownership: `ai_assistant_model` moves public.config_entries →
--      ai.config_entries (schema-scoped config tables — the row's
--      label/description keys are rewritten to the ai.config.* namespace).
--
-- app.smart.ai.* keys STAY in public.translations — they belong to host-owned
-- assistant chrome (chat panels, selectors), not to module pages.

CREATE TABLE IF NOT EXISTS ai.translations (
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

CREATE UNIQUE INDEX IF NOT EXISTS ai_translations_key_language_uidx
  ON ai.translations (key, language)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ai_translations_language_idx
  ON ai.translations (language)
  WHERE deleted_at IS NULL;

-- ─── Moves: settings-scoped AI keys → module namespace ──────────────────────

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.settings\.ai\.', 'ai.console.'), language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.settings.ai.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.settings\.docsIndex\.', 'ai.docs.'), language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.settings.docsIndex.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT 'ai.nav', language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key = 'system.settings.tabs.ai' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT 'ai.nav.docs_index', language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key = 'system.settings.tabs.docsIndex' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT 'ai.module.name', language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key = 'system.settings.tabs.ai' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.settings\.config\.auth\.ai_assistant_model\.', 'ai.config.ai_assistant_model.'), language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.settings.config.auth.ai_assistant_model.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.entities\.ai_model\.', 'ai.entities.ai_model.'), language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.entities.ai_model.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT regexp_replace(key, '^system\.entities\.ai_cerebellum\.', 'ai.entities.ai_cerebellum.'), language, value,
       now(), 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version
FROM system.translations
WHERE key LIKE 'system.entities.ai_cerebellum.%' AND deleted_at IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

DELETE FROM system.translations
WHERE deleted_at IS NULL AND (
     key LIKE 'system.settings.ai.%'
  OR key LIKE 'system.settings.docsIndex.%'
  OR key IN ('system.settings.tabs.ai', 'system.settings.tabs.docsIndex')
  OR key LIKE 'system.settings.config.auth.ai_assistant_model.%'
  OR key LIKE 'system.entities.ai_model.%'
  OR key LIKE 'system.entities.ai_cerebellum.%'
);

-- ─── Config ownership move: public.config_entries → ai.config_entries ───────

INSERT INTO ai.config_entries
  (key, value, type, type_config, label_key, description_key, reserved, group_key,
   uuid, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by)
SELECT
  key, value, type, type_config,
  'ai.config.ai_assistant_model.label',
  'ai.config.ai_assistant_model.description',
  reserved, group_key,
  uuid, created_at, 'migration-ai-pages-ownership', now(), 'migration-ai-pages-ownership', version,
  deleted_at, deleted_by
FROM public.config_entries
WHERE key = 'ai_assistant_model'
ON CONFLICT ("key") DO UPDATE
  SET "value" = EXCLUDED."value",
      "type" = EXCLUDED."type",
      "type_config" = EXCLUDED."type_config",
      "label_key" = EXCLUDED."label_key",
      "description_key" = EXCLUDED."description_key",
      "reserved" = EXCLUDED."reserved",
      "group_key" = EXCLUDED."group_key",
      "updated_at" = now(),
      "updated_by" = 'migration-ai-pages-ownership';

DELETE FROM public.config_entries WHERE key = 'ai_assistant_model';

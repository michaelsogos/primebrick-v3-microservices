-- Primebrick: Job module translations table — DB is the sole source of truth for i18n.
-- The BE manages all CRUD for this schema via its central translations gateway
-- (service_registry discovery → <code>.translations). One row per (key, language)
-- pair. The key is the full dot-path (e.g. 'job.jobs.sections.runs').

CREATE TABLE IF NOT EXISTS job.translations (
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

CREATE UNIQUE INDEX IF NOT EXISTS job_translations_key_language_uidx
  ON job.translations (key, language)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS job_translations_language_idx
  ON job.translations (language)
  WHERE deleted_at IS NULL;

-- ─── Seeds: module-owned page strings (job.jobs.*) ──────────────────────────
-- en-GB
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.nav', 'en-GB', 'Jobs', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.title', 'en-GB', 'Jobs', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleNew', 'en-GB', 'Schedule job', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduledOk', 'en-GB', 'Schedule created', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.recurring', 'en-GB', 'Recurring schedules', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.once', 'en-GB', 'One-time schedules', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.rules', 'en-GB', 'Rules', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.runs', 'en-GB', 'Run history', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.title', 'en-GB', 'New schedule', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.desc', 'en-GB', 'Configure when this job runs.', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.name', 'en-GB', 'Name', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.spec', 'en-GB', 'Schedule', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.lane', 'en-GB', 'Lane', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.targetService', 'en-GB', 'Target service', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.targetAction', 'en-GB', 'Target action', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.preview', 'en-GB', 'Fires {subject} → publishes {target}', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.arm', 'en-GB', 'Schedule', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- it-IT
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.nav', 'it-IT', 'Job', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.title', 'it-IT', 'Job', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleNew', 'it-IT', 'Pianifica job', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduledOk', 'it-IT', 'Pianificazione creata', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.recurring', 'it-IT', 'Pianificazioni ricorrenti', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.once', 'it-IT', 'Esecuzioni singole', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.rules', 'it-IT', 'Regole', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.sections.runs', 'it-IT', 'Storico esecuzioni', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.title', 'it-IT', 'Nuova pianificazione', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.desc', 'it-IT', 'Configura quando eseguire questo job.', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.name', 'it-IT', 'Nome', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.spec', 'it-IT', 'Pianificazione', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.lane', 'it-IT', 'Corsia', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.targetService', 'it-IT', 'Servizio di destinazione', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.targetAction', 'it-IT', 'Azione di destinazione', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.preview', 'it-IT', 'Esegue {subject} → pubblica {target}', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES ('job.jobs.scheduleDialog.arm', 'it-IT', 'Pianifica', now(), 'initial-setup', now(), 'initial-setup', 1) ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

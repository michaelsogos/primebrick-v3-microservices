-- Primebrick: ai phase-4+5 — uuid primary-key swap
--
-- Drops the bigint surrogate `id` PK on every ai entity table and promotes
-- `uuid` (uuidv7, NOT NULL, populated since phase-1) to PRIMARY KEY.
-- `translations` keeps its bigint `id` (internal store, never referenced).
--
-- Pre-conditions verified: every entity-table `uuid` is NOT NULL + unique;
-- no FK/view/trigger depends on any `id` column; audit `entity_uuid` is
-- 100% populated (ai_models_audit 63/63, ai_cerebellum_audit 5/5).

-- ── Safety asserts ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ai.ai_models_audit WHERE entity_uuid IS NULL) THEN
    RAISE EXCEPTION 'ai_models_audit has NULL entity_uuid rows — abort';
  END IF;
  IF EXISTS (SELECT 1 FROM ai.ai_cerebellum_audit WHERE entity_uuid IS NULL) THEN
    RAISE EXCEPTION 'ai_cerebellum_audit has NULL entity_uuid rows — abort';
  END IF;
END $$;

-- ── ai_models ──────────────────────────────────────────────────────────────
ALTER TABLE ai.ai_models DROP CONSTRAINT ai_models_pkey;
DROP INDEX ai.ai_models_uuid_uq;
ALTER TABLE ai.ai_models ADD PRIMARY KEY (uuid);
ALTER TABLE ai.ai_models DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_models_id_seq;

-- ── ai_conversations (partitioned — PK includes partition key) ─────────────
ALTER TABLE ai.ai_conversations DROP CONSTRAINT ai_conversations_pkey;
ALTER TABLE ai.ai_conversations DROP CONSTRAINT ai_conversations_uuid_uq;
ALTER TABLE ai.ai_conversations ADD PRIMARY KEY (uuid, last_seen_at);
ALTER TABLE ai.ai_conversations DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_conversations_id_seq1;

-- ── ai_messages (constraint-backed uuid_uq) ────────────────────────────────
ALTER TABLE ai.ai_messages DROP CONSTRAINT ai_messages_pkey;
ALTER TABLE ai.ai_messages DROP CONSTRAINT ai_messages_uuid_uq;
ALTER TABLE ai.ai_messages ADD PRIMARY KEY (uuid);
ALTER TABLE ai.ai_messages DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_messages_id_seq;

-- ── ai_feedback ────────────────────────────────────────────────────────────
ALTER TABLE ai.ai_feedback DROP CONSTRAINT ai_feedback_pkey;
DROP INDEX ai.ai_feedback_uuid_uq;
ALTER TABLE ai.ai_feedback ADD PRIMARY KEY (uuid);
ALTER TABLE ai.ai_feedback DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_feedback_id_seq;

-- ── ai_telemetry ───────────────────────────────────────────────────────────
ALTER TABLE ai.ai_telemetry DROP CONSTRAINT ai_telemetry_pkey;
DROP INDEX ai.ai_telemetry_uuid_uq;
ALTER TABLE ai.ai_telemetry ADD PRIMARY KEY (uuid);
ALTER TABLE ai.ai_telemetry DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_telemetry_id_seq;

-- ── ai_cerebellum ──────────────────────────────────────────────────────────
ALTER TABLE ai.ai_cerebellum DROP CONSTRAINT ai_cerebellum_pkey;
DROP INDEX ai.ai_cerebellum_uuid_uq;
ALTER TABLE ai.ai_cerebellum ADD PRIMARY KEY (uuid);
ALTER TABLE ai.ai_cerebellum DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.ai_cerebellum_id_seq;

-- ── docs_kb ────────────────────────────────────────────────────────────────
ALTER TABLE ai.docs_kb DROP CONSTRAINT docs_kb_pkey;
DROP INDEX ai.docs_kb_uuid_uq;
ALTER TABLE ai.docs_kb ADD PRIMARY KEY (uuid);
ALTER TABLE ai.docs_kb DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.docs_kb_id_seq;

-- ── docs_ingest_log ────────────────────────────────────────────────────────
ALTER TABLE ai.docs_ingest_log DROP CONSTRAINT docs_ingest_log_pkey;
DROP INDEX ai.docs_ingest_log_uuid_uq;
ALTER TABLE ai.docs_ingest_log ADD PRIMARY KEY (uuid);
ALTER TABLE ai.docs_ingest_log DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.docs_ingest_log_id_seq;

-- ── config_entries (legacy pk/seq names) ───────────────────────────────────
ALTER TABLE ai.config_entries DROP CONSTRAINT config_pkey;
DROP INDEX ai.ai_config_entries_uuid_uq;
ALTER TABLE ai.config_entries ADD PRIMARY KEY (uuid);
ALTER TABLE ai.config_entries DROP COLUMN id;
DROP SEQUENCE IF EXISTS ai.config_id_seq;

-- ── audit: drop surrogate entity_id (entity_uuid is the join key) ──────────
ALTER TABLE ai.ai_models_audit DROP COLUMN entity_id;
ALTER TABLE ai.ai_cerebellum_audit DROP COLUMN entity_id;

-- ── flagged junk: stale soft-delete index on ai config_entries ─────────────
DROP INDEX IF EXISTS ai.ai_config_entries_deleted_at_idx;

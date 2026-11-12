-- 0001 — ai schema baseline (consolidated first-install script).
-- Entity-generated DDL + handwritten supplement for registry-external objects.

-- Primebrick: entity → database patch
-- generatedAt: 2026-11-11T16:11:31.166Z

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "partman";
CREATE EXTENSION IF NOT EXISTS "pg_partman" SCHEMA "partman";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."docs_kb" (
  "id" bigint generated always as identity NOT NULL,
  "repo" varchar(50) NOT NULL,
  "path" text NOT NULL,
  "title" text NOT NULL,
  "chunk_idx" int4 NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(1024) NOT NULL,
  "metadata" jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "docs_kb_repo_idx" ON "ai"."docs_kb" ("repo");
CREATE INDEX IF NOT EXISTS "docs_kb_embedding_idx" ON "ai"."docs_kb" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "docs_kb_content_hash_idx" ON "ai"."docs_kb" ("content_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "docs_kb_repo_path_chunk_idx_uq" ON "ai"."docs_kb" ("repo", "path", "chunk_idx");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_models" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "model_id" varchar(100) NOT NULL,
  "dtype" varchar(20),
  "engine_type" varchar(20) DEFAULT 'webllm' NOT NULL,
  "name" varchar(100) NOT NULL,
  "label_key" varchar(200),
  "description_key" varchar(200),
  "power_level" integer DEFAULT 3 NOT NULL,
  "rank" float8 DEFAULT 1.0 NOT NULL,
  "test_scores" jsonb,
  "enable_thinking" boolean DEFAULT false NOT NULL,
  "temperature" float8 DEFAULT 0.70 NOT NULL,
  "top_p" float8 DEFAULT 0.90 NOT NULL,
  "max_tokens" integer DEFAULT 256 NOT NULL,
  "repetition_penalty" float8 DEFAULT 1.10 NOT NULL,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "download_size_mb" integer,
  "vram_mb" float8,
  "is_compatible" boolean DEFAULT true NOT NULL,
  "kv_cache_bytes_per_token" int8,
  "flops_per_token" float8,
  "working_set_mb" float8,
  "working_set_source" varchar(20) DEFAULT 'hf_estimate' NOT NULL,
  "working_set_detail" jsonb,
  "execution_config" jsonb,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_models_model_id_dtype_uq" ON "ai"."ai_models" ("model_id", "dtype");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_models_uuid_uq" ON "ai"."ai_models" ("uuid");

CREATE TABLE IF NOT EXISTS "ai"."ai_models_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('ai.ai_models_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "ai_models_audit_entity_uuid_idx" ON "ai"."ai_models_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "ai_models_audit_action_idx" ON "ai"."ai_models_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_cerebellum" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assistant_key" varchar(60) NOT NULL,
  "model_id" varchar(100) NOT NULL,
  "dtype" varchar(40),
  "name" varchar(80) NOT NULL,
  "description_key" varchar(200),
  "enable_thinking" boolean,
  "temperature" float8,
  "top_p" float8,
  "max_tokens" integer,
  "repetition_penalty" float8,
  "execution_config" jsonb,
  "test_scores" jsonb,
  "recommendation" varchar(20),
  "is_compatible" boolean DEFAULT true NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_cerebellum_assistant_model_dtype_uq" ON "ai"."ai_cerebellum" ("assistant_key", "model_id", "dtype") NULLS NOT DISTINCT;
CREATE UNIQUE INDEX IF NOT EXISTS "ai_cerebellum_uuid_uq" ON "ai"."ai_cerebellum" ("uuid");

CREATE TABLE IF NOT EXISTS "ai"."ai_cerebellum_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('ai.ai_cerebellum_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "ai_cerebellum_audit_entity_uuid_idx" ON "ai"."ai_cerebellum_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "ai_cerebellum_audit_action_idx" ON "ai"."ai_cerebellum_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."config_entries" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text,
  "type" varchar(50) NOT NULL,
  "type_config" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "reserved" boolean NOT NULL,
  "group_key" varchar(100),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_uuid_uq" ON "ai"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "ai"."config_entries" ("key");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."docs_ingest_log" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "repo" varchar(100),
  "service_code" varchar(100) NOT NULL,
  "trigger_source" varchar(20) NOT NULL,
  "ok" boolean NOT NULL,
  "stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "error" text,
  PRIMARY KEY ("id")
);

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_conversations" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text,
  "last_seen_at" timestamptz NOT NULL,
  PRIMARY KEY ("id", "last_seen_at")
) PARTITION BY RANGE ("last_seen_at");

SELECT partman.create_parent('ai.ai_conversations', 'last_seen_at', '1 month', 'range');
UPDATE partman.part_config SET retention = '6 months', retention_keep_table = false WHERE parent_table = 'ai.ai_conversations';

CREATE UNIQUE INDEX IF NOT EXISTS "ai_conversations_uuid_uq" ON "ai"."ai_conversations" ("uuid", "last_seen_at");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_messages" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_uuid" uuid NOT NULL,
  "role" text NOT NULL,
  "content" jsonb NOT NULL,
  "tokens_in" int4,
  "tokens_out" int4,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_messages_uuid_uq" ON "ai"."ai_messages" ("uuid");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_feedback" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "message_uuid" uuid NOT NULL,
  "conversation_uuid" uuid,
  "rating" text NOT NULL,
  "comment" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_feedback_uuid_uq" ON "ai"."ai_feedback" ("uuid");

CREATE SCHEMA IF NOT EXISTS "ai";

CREATE TABLE IF NOT EXISTS "ai"."ai_telemetry" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_uuid" uuid,
  "user_uuid" uuid NOT NULL,
  "model" text NOT NULL,
  "tokens_in" int4 NOT NULL,
  "tokens_out" int4 NOT NULL,
  "steps" int4 NOT NULL,
  "tool_calls" int4 NOT NULL,
  "rag_hits" int4 NOT NULL,
  "latency_ms" int4 NOT NULL,
  "success" boolean NOT NULL,
  "error" text,
  "created_at" timestamptz NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_telemetry_uuid_uq" ON "ai"."ai_telemetry" ("uuid");
-- ─── Handwritten supplement ──────────────────────────────────────────────
-- Objects the entity registry does not declare:
--   • ai.translations — CRUD via entity route, excluded from registry by design
--   • CHECK constraint (not declarable via decorators today)
--   • partial unique index (unique+WHERE not expressible via @Index)
--   • DB-only lookup indexes (not declared on entities)

\restrict qcvY2BCylSIgj6ILnpCAZaZbFndLio7gREECJD1tjdYenSwQeBaEePjJMGltas1
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE IF NOT EXISTS ai.translations (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    language character varying(10) NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(255) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT translations_key_shape CHECK (((key)::text ~ '^ai(\.[a-z0-9_]+)+$'::text))
);
CREATE SEQUENCE IF NOT EXISTS ai.translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE ai.translations_id_seq OWNED BY ai.translations.id;
ALTER TABLE ONLY ai.translations ALTER COLUMN id SET DEFAULT nextval('ai.translations_id_seq'::regclass);
ALTER TABLE ONLY ai.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY ai.translations
    ADD CONSTRAINT translations_uuid_key UNIQUE (uuid);
CREATE UNIQUE INDEX IF NOT EXISTS ai_translations_key_language_uidx ON ai.translations USING btree (key, language) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS ai_translations_language_idx ON ai.translations USING btree (language) WHERE (deleted_at IS NULL);
\unrestrict qcvY2BCylSIgj6ILnpCAZaZbFndLio7gREECJD1tjdYenSwQeBaEePjJMGltas1


ALTER TABLE ONLY ai.ai_feedback ADD CONSTRAINT ai_feedback_rating_check CHECK ((rating = ANY (ARRAY['up'::text, 'down'::text])));

CREATE UNIQUE INDEX IF NOT EXISTS ai_cerebellum_one_default_per_assistant_uq ON ai.ai_cerebellum USING btree (assistant_key) WHERE (is_default AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS ai_config_entries_deleted_at_idx ON ai.config_entries USING btree (deleted_at);
CREATE INDEX IF NOT EXISTS ai_conversations_created_by_idx ON ai.ai_conversations USING btree (created_by);
CREATE INDEX IF NOT EXISTS ai_feedback_created_by_idx ON ai.ai_feedback USING btree (created_by);
CREATE INDEX IF NOT EXISTS ai_feedback_message_uuid_idx ON ai.ai_feedback USING btree (message_uuid);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_uuid_created_at_idx ON ai.ai_messages USING btree (conversation_uuid, created_at);
CREATE INDEX IF NOT EXISTS ai_telemetry_created_at_idx ON ai.ai_telemetry USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_telemetry_user_uuid_created_at_idx ON ai.ai_telemetry USING btree (user_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS docs_ingest_log_created_idx ON ai.docs_ingest_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS docs_ingest_log_repo_idx ON ai.docs_ingest_log USING btree (repo);

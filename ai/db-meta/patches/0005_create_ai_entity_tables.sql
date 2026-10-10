-- 0005 — Create AI-owned entity tables directly in the `ai` schema.
--
-- Covers fresh-database provisioning: historically ai_models / ai_cerebellum
-- were created by the BE init patch in `public` and moved to `ai` by patch
-- 0004. On a fresh DB 0004 finds nothing to move, so this patch creates the
-- tables natively in `ai`. On existing DBs every statement is IF NOT EXISTS —
-- the moved tables are already there and this is a no-op.
--
-- DDL mirrors the live schema (verified against information_schema after all
-- fire-and-forget evolutions: dtype/engine_type/working_set_*/test_scores/
-- is_compatible/recommendation columns and the current unique indexes).

BEGIN;

-- ─── ai.ai_models ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai"."ai_models" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "model_id" varchar(100) NOT NULL,
  "name" varchar(100) NOT NULL,
  "label_key" varchar(200),
  "description_key" varchar(200),
  "power_level" integer NOT NULL DEFAULT 3,
  "enable_thinking" boolean NOT NULL DEFAULT false,
  "temperature" numeric(3,2) NOT NULL DEFAULT 0.70,
  "top_p" numeric(3,2) NOT NULL DEFAULT 0.90,
  "max_tokens" integer NOT NULL DEFAULT 256,
  "repetition_penalty" numeric(3,2) NOT NULL DEFAULT 1.10,
  "sort_order" integer NOT NULL DEFAULT 100,
  "download_size_mb" integer,
  "vram_mb" numeric(8,2),
  "rank" numeric(3,1) NOT NULL DEFAULT 1.0,
  "test_scores" jsonb,
  "dtype" varchar(20),
  "engine_type" varchar(20) NOT NULL DEFAULT 'webllm',
  "execution_config" jsonb,
  "kv_cache_bytes_per_token" bigint,
  "flops_per_token" numeric,
  "working_set_mb" numeric,
  "working_set_source" varchar(20) NOT NULL DEFAULT 'hf_estimate',
  "working_set_detail" jsonb,
  "is_compatible" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  "deleted_at" timestamptz,
  "deleted_by" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_models_uuid_uq" ON "ai"."ai_models" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_models_model_id_dtype_uq" ON "ai"."ai_models" ("model_id", "dtype");

COMMENT ON COLUMN "ai"."ai_models"."model_id" IS 'Exact WebLLM model ID passed to CreateMLCEngine (e.g. Qwen3-1.7B-q4f16_1-MLC)';
COMMENT ON COLUMN "ai"."ai_models"."power_level" IS 'Power indicator 1-5 (1=Lowest, 5=Highest). Drives the 5-bar UI.';

-- ─── ai.ai_cerebellum ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai"."ai_cerebellum" (
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assistant_key" varchar(60) NOT NULL,
  "model_id" varchar(100) NOT NULL,
  "dtype" varchar(40),
  "name" varchar(80) NOT NULL,
  "description_key" varchar(200),
  "enable_thinking" boolean,
  "temperature" numeric(3,2),
  "top_p" numeric(3,2),
  "max_tokens" integer,
  "repetition_penalty" numeric(3,2),
  "execution_config" jsonb,
  "test_scores" jsonb,
  "recommendation" varchar(20),
  "is_compatible" boolean NOT NULL DEFAULT true,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text,
  "version" integer DEFAULT 1,
  "deleted_at" timestamptz,
  "deleted_by" text,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_cerebellum_uuid_uq" ON "ai"."ai_cerebellum" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "ai_cerebellum_assistant_model_dtype_uq"
  ON "ai"."ai_cerebellum" ("assistant_key", "model_id", "dtype") NULLS NOT DISTINCT;
CREATE UNIQUE INDEX IF NOT EXISTS "ai_cerebellum_one_default_per_assistant_uq"
  ON "ai"."ai_cerebellum" ("assistant_key") WHERE ("is_default" AND "deleted_at" IS NULL);

-- ─── audit tables (monthly RANGE partitions via pg_partman) ───────────────
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

CREATE INDEX IF NOT EXISTS "ai_models_audit_entity_uuid_idx" ON "ai"."ai_models_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "ai_models_audit_action_idx" ON "ai"."ai_models_audit" ("action");

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

CREATE INDEX IF NOT EXISTS "ai_cerebellum_audit_entity_uuid_idx" ON "ai"."ai_cerebellum_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "ai_cerebellum_audit_action_idx" ON "ai"."ai_cerebellum_audit" ("action");

-- pg_partman setup (idempotent, best-effort when extension is absent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman' AND table_name = 'part_config'
  ) OR NOT EXISTS (
    SELECT 1 FROM partman.part_config WHERE parent_table = 'ai.ai_models_audit'
  ) THEN
    PERFORM partman.create_parent('ai.ai_models_audit', 'changed_at', '1 month');
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman' AND table_name = 'part_config'
  ) OR NOT EXISTS (
    SELECT 1 FROM partman.part_config WHERE parent_table = 'ai.ai_cerebellum_audit'
  ) THEN
    PERFORM partman.create_parent('ai.ai_cerebellum_audit', 'changed_at', '1 month');
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

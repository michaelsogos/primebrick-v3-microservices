-- Primebrick AI microservice: AI chat tables.
-- Creates the AI chat tables in the "ai" schema (microservice isolation).
-- The vector extension is also created here (pgvector for RAG embeddings).
-- auth_events stays in the public schema (BE's domain — auth-event-logger
-- writes from the BE, and the BE's MCP entity registry exposes it).

-- pgvector extension (required for docs_kb embedding column).
-- The extension itself is installed at the Postgres cluster level (the custom
-- pgvector Docker image). CREATE EXTENSION activates it in this database.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE EXTENSION vector;
  END IF;
END $$;

-- docs_kb: Knowledge base docs (chunked + embedded for RAG)
CREATE TABLE IF NOT EXISTS "ai"."docs_kb" (
  "id" bigint generated always as identity PRIMARY KEY,
  "repo" text NOT NULL,
  "path" text NOT NULL,
  "title" text NOT NULL,
  "chunk_idx" int NOT NULL,
  "content" text NOT NULL,
  "embedding" vector(384) NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "content_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("repo", "path", "chunk_idx")
);

CREATE INDEX IF NOT EXISTS "docs_kb_embedding_idx" ON "ai"."docs_kb"
  USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS "docs_kb_repo_idx" ON "ai"."docs_kb" ("repo");
CREATE INDEX IF NOT EXISTS "docs_kb_content_hash_idx" ON "ai"."docs_kb" ("content_hash");

-- ai_conversations: AI chat conversations
CREATE TABLE IF NOT EXISTS "ai"."ai_conversations" (
  "uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_uuid" uuid NOT NULL,
  "title" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_conversations_user_uuid_updated_at_idx"
  ON "ai"."ai_conversations" ("user_uuid", "updated_at" DESC);

-- ai_messages: AI chat messages (user, assistant, tool_call, tool_result)
CREATE TABLE IF NOT EXISTS "ai"."ai_messages" (
  "uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_uuid" uuid NOT NULL REFERENCES "ai"."ai_conversations"("uuid") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" jsonb NOT NULL,
  "tokens_in" int,
  "tokens_out" int,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_messages_conversation_uuid_created_at_idx"
  ON "ai"."ai_messages" ("conversation_uuid", "created_at");

-- ai_feedback: User feedback on AI assistant messages (thumbs up/down).
CREATE TABLE IF NOT EXISTS "ai"."ai_feedback" (
  "id" bigint generated always as identity PRIMARY KEY,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "message_uuid" uuid NOT NULL,
  "conversation_uuid" uuid,
  "user_uuid" uuid NOT NULL,
  "rating" text NOT NULL CHECK ("rating" IN ('up', 'down')),
  "comment" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_feedback_uuid_uq" ON "ai"."ai_feedback" ("uuid");
CREATE INDEX IF NOT EXISTS "ai_feedback_message_uuid_idx" ON "ai"."ai_feedback" ("message_uuid");
CREATE INDEX IF NOT EXISTS "ai_feedback_user_uuid_created_at_idx"
  ON "ai"."ai_feedback" ("user_uuid", "created_at" DESC);

-- ai_telemetry: Per-request telemetry for the AI orchestrator.
CREATE TABLE IF NOT EXISTS "ai"."ai_telemetry" (
  "id" bigint generated always as identity PRIMARY KEY,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_uuid" uuid,
  "user_uuid" uuid NOT NULL,
  "model" text NOT NULL,
  "tokens_in" int NOT NULL DEFAULT 0,
  "tokens_out" int NOT NULL DEFAULT 0,
  "steps" int NOT NULL DEFAULT 0,
  "tool_calls" int NOT NULL DEFAULT 0,
  "rag_hits" int NOT NULL DEFAULT 0,
  "latency_ms" int NOT NULL DEFAULT 0,
  "success" boolean NOT NULL DEFAULT true,
  "error" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_telemetry_uuid_uq" ON "ai"."ai_telemetry" ("uuid");
CREATE INDEX IF NOT EXISTS "ai_telemetry_user_uuid_created_at_idx"
  ON "ai"."ai_telemetry" ("user_uuid", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "ai_telemetry_created_at_idx"
  ON "ai"."ai_telemetry" ("created_at" DESC);

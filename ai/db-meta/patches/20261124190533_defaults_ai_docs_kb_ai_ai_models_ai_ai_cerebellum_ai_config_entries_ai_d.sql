-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:05:33.922Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."docs_kb" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."docs_kb" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_models" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_models" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_conversations" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_conversations" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "last_seen_at" → clock_timestamp() (db=(none))
ALTER TABLE "ai"."ai_conversations" ALTER COLUMN "last_seen_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_messages" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_messages" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_feedback" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_feedback" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();

-- WARN: DB-only index "docs_ingest_log_repo_idx" on ai.docs_ingest_log — not dropped
-- WARN: DB-only index "ai_conversations_created_by_idx" on ai.ai_conversations — not dropped
-- WARN: DB-only index "ai_messages_conversation_uuid_created_at_idx" on ai.ai_messages — not dropped
-- WARN: DB-only index "ai_feedback_created_by_idx" on ai.ai_feedback — not dropped
-- WARN: DB-only index "ai_feedback_message_uuid_idx" on ai.ai_feedback — not dropped

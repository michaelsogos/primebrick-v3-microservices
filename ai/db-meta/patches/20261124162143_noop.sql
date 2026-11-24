-- Primebrick: entity → database patch
-- pb:segments
-- generatedAt: 2026-11-24T16:21:43.488Z

-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "config_entries_key_uq" ON "ai"."config_entries" ("key") WHERE deleted_at IS NULL;
-- pb:end-no-transaction

-- WARN: DB-only index "ai_config_entries_key_uq" on ai.config_entries — not dropped

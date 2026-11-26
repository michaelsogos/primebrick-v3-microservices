-- Primebrick: entity → database patch
-- pb:segments
-- pb:requires-review
-- generatedAt: 2026-11-24T16:57:53.710Z

-- pb:begin-no-transaction
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "config_entries_key_uq" ON "ai"."config_entries" ("key") WHERE deleted_at IS NULL;
-- pb:end-no-transaction

-- WARN: DB-only index "ai_config_entries_key_uq" on ai.config_entries — not dropped

-- ── review section (runs only after approval) ──
-- manual: legacy-named full-unique orphan — superseded by canonical
-- config_entries_key_uq (created above, partial aliveOnly). Dropped so the
-- tombstone-blocking semantics of the old index stop applying.
DROP INDEX IF EXISTS "ai"."ai_config_entries_key_uq";
-- manual: canonical-name alignment — decl name wins, zero rebuild.
ALTER INDEX IF EXISTS "ai"."docs_kb_repo_path_chunk_idx_key" RENAME TO "docs_kb_repo_path_chunk_idx_uq";

-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-10-15T14:44:24.290Z

-- ── review section (runs only after approval) ──
-- REVIEW type change "repo" entity≈varchar db≈text (may rewrite the table)
ALTER TABLE "ai"."docs_kb" ALTER COLUMN "repo" TYPE varchar(50);
-- REVIEW type change "embedding" entity≈raw:vector(1024) db≈raw:vector (may rewrite the table)
ALTER TABLE "ai"."docs_kb" ALTER COLUMN "embedding" TYPE vector(1024);
-- REVIEW type change "rank" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "rank" TYPE float8;
-- REVIEW type change "temperature" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "temperature" TYPE float8;
-- REVIEW type change "top_p" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "top_p" TYPE float8;
-- REVIEW type change "repetition_penalty" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "repetition_penalty" TYPE float8;
-- REVIEW type change "vram_mb" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "vram_mb" TYPE float8;
-- REVIEW type change "flops_per_token" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "flops_per_token" TYPE float8;
-- REVIEW type change "working_set_mb" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_models" ALTER COLUMN "working_set_mb" TYPE float8;
-- REVIEW type change "temperature" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "temperature" TYPE float8;
-- REVIEW type change "top_p" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "top_p" TYPE float8;
-- REVIEW type change "repetition_penalty" entity≈float8 db≈numeric (may rewrite the table)
ALTER TABLE "ai"."ai_cerebellum" ALTER COLUMN "repetition_penalty" TYPE float8;
-- REVIEW type change "repo" entity≈varchar db≈text (may rewrite the table)
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN "repo" TYPE varchar(100);
-- REVIEW type change "service_code" entity≈varchar db≈text (may rewrite the table)
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN "service_code" TYPE varchar(100);
-- REVIEW type change "trigger_source" entity≈varchar db≈text (may rewrite the table)
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN "trigger_source" TYPE varchar(20);

-- WARN: DB-only index "docs_kb_repo_path_chunk_idx_key" on ai.docs_kb — not dropped
-- WARN: DB-only index "docs_kb_repo_idx" on ai.docs_kb — not dropped
-- WARN: DB-only index "docs_kb_content_hash_idx" on ai.docs_kb — not dropped
-- WARN: DB-only index "docs_kb_embedding_idx" on ai.docs_kb — not dropped
-- WARN: DB-only index "ai_cerebellum_one_default_per_assistant_uq" on ai.ai_cerebellum — not dropped
-- WARN: DB-only index "docs_ingest_log_created_idx" on ai.docs_ingest_log — not dropped
-- WARN: DB-only index "docs_ingest_log_repo_idx" on ai.docs_ingest_log — not dropped

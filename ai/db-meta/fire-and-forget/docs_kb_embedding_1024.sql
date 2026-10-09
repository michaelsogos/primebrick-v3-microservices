-- Migration: ai.docs_kb.embedding vector(384) → vector(1024)
-- Reason: switch from paraphrase-multilingual-MiniLM-L12-v2 (384-dim,
-- paraphrase-trained) to multilingual-e5-large-instruct (1024-dim,
-- instruction-aware, real cross-lingual retrieval). Old embeddings are a
-- different vector space and cannot be reused — docs_kb is derived data,
-- it is truncated and re-indexed via `bun scripts/index-docs.ts`.

TRUNCATE TABLE "ai"."docs_kb";

ALTER TABLE "ai"."docs_kb"
  ALTER COLUMN "embedding" TYPE vector(1024);

-- Recreate the HNSW index on the resized column (the index stays valid on
-- ALTER TYPE but rebuilding guarantees clean state).
DROP INDEX IF EXISTS "ai"."docs_kb_embedding_idx";
CREATE INDEX IF NOT EXISTS "docs_kb_embedding_idx" ON "ai"."docs_kb"
  USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Patch registry: 0002_ai_chat_tables.sql was updated to vector(1024) for
-- fresh installs — record the new content_sha256 so applyPatches accepts it.
UPDATE "public"."primebrick_database_patches"
SET content_sha256 = 'a2686f2070958c0889b79e0a1994885109399b167b3a33ce661a7565bfedb0b2'
WHERE patch_id = '0002_ai_chat_tables'
  AND content_sha256 <> 'a2686f2070958c0889b79e0a1994885109399b167b3a33ce661a7565bfedb0b2';

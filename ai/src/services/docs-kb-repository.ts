/**
 * docs_kb repository — vector search and upsert for RAG.
 *
 * Uses raw SQL (not the DAL Repository) because pgvector types and the
 * cosine similarity operator (<=>) are not supported by the metadata-driven
 * DAL. The pool comes from the DAL gateway.
 */
import { getDal } from "../db/dal.js";
import { createHash } from "node:crypto";

export interface DocsKbRow {
  id: bigint;
  repo: string;
  path: string;
  title: string;
  chunk_idx: number;
  content: string;
  metadata: Record<string, unknown>;
  content_hash: string;
}

export interface SearchResult extends DocsKbRow {
  similarity: number;
}

/**
 * Upsert a chunk into docs_kb.
 * Uses ON CONFLICT (repo, path, chunk_idx) to update existing chunks.
 */
export async function upsertDocChunk(opts: {
  repo: string;
  path: string;
  title: string;
  chunk_idx: number;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}): Promise<void> {
  const pool = getDal().getPool();
  const contentHash = createHash("sha256").update(opts.content).digest("hex");
  const embeddingStr = `[${opts.embedding.join(",")}]`;

  await pool.query(
    `INSERT INTO docs_kb (repo, path, title, chunk_idx, content, embedding, metadata, content_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (repo, path, chunk_idx)
     DO UPDATE SET
       title = EXCLUDED.title,
       content = EXCLUDED.content,
       embedding = EXCLUDED.embedding,
       metadata = EXCLUDED.metadata,
       content_hash = EXCLUDED.content_hash,
       updated_at = now()`,
    [
      opts.repo,
      opts.path,
      opts.title,
      opts.chunk_idx,
      opts.content,
      embeddingStr,
      JSON.stringify(opts.metadata),
      contentHash,
    ],
  );
}

/**
 * Get the content_hash for all chunks of a given (repo, path).
 * Used to detect which docs have changed and need re-embedding.
 */
export async function getDocHashes(repo: string, path: string): Promise<Map<number, string>> {
  const pool = getDal().getPool();
  const result = await pool.query<{ chunk_idx: number; content_hash: string }>(
    `SELECT chunk_idx, content_hash FROM docs_kb WHERE repo = $1 AND path = $2`,
    [repo, path],
  );
  const map = new Map<number, string>();
  for (const row of result.rows) {
    map.set(row.chunk_idx, row.content_hash);
  }
  return map;
}

/**
 * Delete chunks for a (repo, path) that are no longer present in the source.
 * Called after upserting new chunks to remove stale entries.
 */
export async function deleteStaleChunks(repo: string, path: string, validChunkIndices: number[]): Promise<void> {
  const pool = getDal().getPool();
  if (validChunkIndices.length === 0) {
    await pool.query(`DELETE FROM docs_kb WHERE repo = $1 AND path = $2`, [repo, path]);
    return;
  }
  await pool.query(
    `DELETE FROM docs_kb WHERE repo = $1 AND path = $2 AND NOT (chunk_idx = ANY($3::int[]))`,
    [repo, path, validChunkIndices],
  );
}

/**
 * Get all distinct (repo, path) pairs in docs_kb.
 * Used to detect docs that have been deleted from the source.
 */
export async function getAllDocPaths(): Promise<Array<{ repo: string; path: string }>> {
  const pool = getDal().getPool();
  const result = await pool.query<{ repo: string; path: string }>(
    `SELECT DISTINCT repo, path FROM docs_kb`,
  );
  return result.rows;
}

/**
 * Delete all chunks for a (repo, path) — used when a doc is removed from source.
 */
export async function deleteDoc(repo: string, path: string): Promise<void> {
  const pool = getDal().getPool();
  await pool.query(`DELETE FROM docs_kb WHERE repo = $1 AND path = $2`, [repo, path]);
}

/**
 * Vector search: find the top-k most similar chunks to a query embedding.
 * Uses pgvector cosine distance operator (<=>) with ivfflat index.
 *
 * @param queryEmbedding 384-dim vector from the embedding provider.
 * @param topK Number of results (default 4).
 * @param repoFilter Optional repo filter (e.g. "backend", "frontend").
 */
export async function vectorSearch(
  queryEmbedding: number[],
  topK: number = 4,
  repoFilter?: string,
): Promise<SearchResult[]> {
  const pool = getDal().getPool();
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const filterClause = repoFilter ? `WHERE repo = $3` : "";
  const params = repoFilter
    ? [embeddingStr, topK, repoFilter]
    : [embeddingStr, topK];

  const result = await pool.query<{
    id: bigint;
    repo: string;
    path: string;
    title: string;
    chunk_idx: number;
    content: string;
    metadata: Record<string, unknown>;
    content_hash: string;
    similarity: number;
  }>(
    `SELECT
       id, repo, path, title, chunk_idx, content, metadata, content_hash,
       1 - (embedding <=> $1::vector) AS similarity
     FROM docs_kb
     ${filterClause}
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    params as never[],
  );

  return result.rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
}

/**
 * Count total chunks in docs_kb.
 */
export async function countDocs(): Promise<number> {
  const pool = getDal().getPool();
  const result = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM docs_kb`);
  return parseInt(result.rows[0].count, 10);
}

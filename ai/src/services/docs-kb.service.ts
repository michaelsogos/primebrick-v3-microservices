/**
 * docs_kb repository — vector search and chunk persistence for RAG.
 *
 * Pure DAL: `findAll`/`addMany`/`updateMany`/`hardDeleteMany`/`vectorSearch`
 * on `DocsKbEntity` — no raw SQL, no `getPool()`, no upsert. Ingestion
 * follows the explicit diff→bulk contract: the pipeline decides per-chunk
 * whether it's new (`insertDocChunks` → `addMany`) or changed
 * (`updateDocChunks` → `updateMany` by the (repo,path,chunk_idx) unique
 * group); stale rows are physically deleted (`hardDeleteMany` — docs_kb is
 * a derived index, not auditable domain data, and soft-delete is
 * meaningless for regenerable rows).
 */
import { field, Filter, Project } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import { DocsKbEntity } from "../domain/entities/docs_kb_entity.js";

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

export interface DocChunkWrite {
  repo: string;
  path: string;
  title: string;
  chunk_idx: number;
  content: string;
  content_hash: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

const CHUNK_MATCH_BY = ["repo", "path", "chunk_idx"] as const;

const KB_PROJECTIONS = [
  Project.field(field(DocsKbEntity, "id")),
  Project.field(field(DocsKbEntity, "repo")),
  Project.field(field(DocsKbEntity, "path")),
  Project.field(field(DocsKbEntity, "title")),
  Project.field(field(DocsKbEntity, "chunk_idx")),
  Project.field(field(DocsKbEntity, "content")),
  Project.field(field(DocsKbEntity, "metadata")),
  Project.field(field(DocsKbEntity, "content_hash")),
];

/** Bulk-insert NEW chunks — caller guarantees no (repo,path,chunk_idx) conflicts. */
export async function insertDocChunks(rows: DocChunkWrite[]): Promise<void> {
  if (rows.length === 0) return;
  await getDal().addMany(DocsKbEntity, rows, {});
}

/** Bulk-update chunks whose content_hash changed — re-embed path (physical update, never upsert). */
export async function updateDocChunks(rows: DocChunkWrite[]): Promise<void> {
  if (rows.length === 0) return;
  await getDal().updateMany(
    DocsKbEntity,
    rows.map((r) => ({
      repo: r.repo,
      path: r.path,
      chunk_idx: r.chunk_idx,
      title: r.title,
      content: r.content,
      embedding: r.embedding,
      metadata: r.metadata,
      content_hash: r.content_hash,
      updated_at: new Date(),
    })),
    { matchBy: [...CHUNK_MATCH_BY] },
  );
}

/**
 * Get the content_hash for all chunks of a given (repo, path).
 * Used to detect which docs have changed and need re-embedding.
 */
export async function getDocHashes(repo: string, path: string): Promise<Map<number, string>> {
  const rows = (await getDal().findAll<
    DocsKbEntity,
    { chunk_idx: number; content_hash: string }
  >(DocsKbEntity, [Project.field(field(DocsKbEntity, "chunk_idx")), Project.field(field(DocsKbEntity, "content_hash"))], {
    filters: [
      Filter.fieldValue(field(DocsKbEntity, "repo"), "=", repo),
      Filter.fieldValue(field(DocsKbEntity, "path"), "=", path),
    ],
  })) as Array<{ chunk_idx: number; content_hash: string }>;
  const map = new Map<number, string>();
  for (const row of rows) map.set(row.chunk_idx, row.content_hash);
  return map;
}

/**
 * Physically delete chunks of a (repo, path) no longer present in the
 * source — hard delete: derived index rows are regenerated, not tombstoned.
 */
export async function deleteStaleChunks(repo: string, path: string, validChunkIndices: number[]): Promise<void> {
  const valid = new Set(validChunkIndices);
  const stale = (await getDal().findAll<DocsKbEntity, { chunk_idx: number }>(
    DocsKbEntity,
    [Project.field(field(DocsKbEntity, "chunk_idx"))],
    {
      filters: [
        Filter.fieldValue(field(DocsKbEntity, "repo"), "=", repo),
        Filter.fieldValue(field(DocsKbEntity, "path"), "=", path),
      ],
    },
  )) as Array<{ chunk_idx: number }>;
  const matches = stale
    .filter((r) => !valid.has(r.chunk_idx))
    .map((r) => ({ repo, path, chunk_idx: r.chunk_idx }));
  if (matches.length === 0) return;
  await getDal().hardDeleteMany(DocsKbEntity, matches, { matchBy: [...CHUNK_MATCH_BY] });
}

/** Get all distinct (repo, path) pairs in docs_kb — detect docs deleted from source. */
export async function getAllDocPaths(): Promise<Array<{ repo: string; path: string }>> {
  return (await getDal().findAll<DocsKbEntity, { repo: string; path: string }>(
    DocsKbEntity,
    [Project.field(field(DocsKbEntity, "repo")), Project.field(field(DocsKbEntity, "path"))],
    { groupBy: [field(DocsKbEntity, "repo"), field(DocsKbEntity, "path")] },
  )) as Array<{ repo: string; path: string }>;
}

/** Physically delete all chunks of a (repo, path) — doc removed from source. */
export async function deleteDoc(repo: string, path: string): Promise<void> {
  const matches = (await getDal().findAll<DocsKbEntity, { chunk_idx: number }>(
    DocsKbEntity,
    [Project.field(field(DocsKbEntity, "chunk_idx"))],
    {
      filters: [
        Filter.fieldValue(field(DocsKbEntity, "repo"), "=", repo),
        Filter.fieldValue(field(DocsKbEntity, "path"), "=", path),
      ],
    },
  )) as Array<{ chunk_idx: number }>;
  if (matches.length === 0) return;
  await getDal().hardDeleteMany(
    DocsKbEntity,
    matches.map((r) => ({ repo, path, chunk_idx: r.chunk_idx })),
    { matchBy: [...CHUNK_MATCH_BY] },
  );
}

/** Physically delete every doc of one repo — service unregister cleans the KB. */
export async function deleteRepoDocs(repo: string): Promise<number> {
  const matches = (await getDal().findAll<DocsKbEntity, { chunk_idx: number; path: string }>(
    DocsKbEntity,
    [Project.field(field(DocsKbEntity, "path")), Project.field(field(DocsKbEntity, "chunk_idx"))],
    { filters: [Filter.fieldValue(field(DocsKbEntity, "repo"), "=", repo)] },
  )) as Array<{ path: string; chunk_idx: number }>;
  if (matches.length === 0) return 0;
  const res = await getDal().hardDeleteMany(
    DocsKbEntity,
    matches.map((r) => ({ repo, path: r.path, chunk_idx: r.chunk_idx })),
    { matchBy: [...CHUNK_MATCH_BY] },
  );
  return res.affected;
}

/**
 * Wipe the whole index — explicit full-reinit path only (provider/schema
 * change, corrupted KB). `dal.truncate` resolves the table through entity
 * metadata, so the schema-domain guard still applies.
 */
export async function truncateDocsKb(): Promise<void> {
  await getDal().truncate(DocsKbEntity);
}

/**
 * Vector search: top-k most similar chunks to a query embedding.
 * pgvector cosine distance (`<=>`) — the query vector is bound as a
 * parameter so the HNSW index is used (never interpolated).
 *
 * @param queryEmbedding query vector from the embedding provider (1024-dim
 *  with multilingual-e5-large-instruct; the size follows EMBEDDING_MODEL).
 * @param topK Number of results (default 4).
 * @param repoFilter Optional repo filter (e.g. "backend", "frontend").
 */
export async function vectorSearch(
  queryEmbedding: number[],
  topK: number = 4,
  repoFilter?: string,
): Promise<SearchResult[]> {
  return (await getDal().vectorSearch<DocsKbEntity, DocsKbRow>(
    DocsKbEntity,
    field(DocsKbEntity, "embedding"),
    queryEmbedding,
    {
      topK,
      fields: KB_PROJECTIONS,
      filters: [
        // chunk_idx = -1 rows carry the full raw doc for display — never a hit.
        Filter.fieldValue(field(DocsKbEntity, "chunk_idx"), ">=", 0),
        ...(repoFilter ? [Filter.fieldValue(field(DocsKbEntity, "repo"), "=", repoFilter)] : []),
      ],
    },
  )) as SearchResult[];
}

/** Count total chunks in docs_kb. */
export async function countDocs(): Promise<number> {
  return Number(await getDal().count(DocsKbEntity));
}

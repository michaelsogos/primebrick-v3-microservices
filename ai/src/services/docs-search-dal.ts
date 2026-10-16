/**
 * docs_kb search DAL — semantic + keyword search over the documentation
 * knowledge base (`ai.docs_kb`, populated by the ai microservice's manual
 * embedding pipeline).
 *
 * All SQL is built by the DAL's `vectorSearch` hybrid builder — no raw
 * `pool.query`. The BE never embeds text — callers pass a pre-computed
 * query embedding (384-dim float array); all vector math runs inside
 * Postgres.
 *
 * Ranking: two-phase. Phase 1 uses the HNSW index to fetch the top-N nearest
 * chunks by cosine distance (ORDER BY embedding <=> $1 — the index is only
 * used with this exact ordering expression, so keyword terms CANNOT be mixed
 * in here). Phase 2 re-ranks that small candidate set with a keyword boost:
 * literal terms (identifiers like "IDP Code", config keys, error codes)
 * matched case-insensitively against title, path and content. The ILIKE
 * scan runs on ~24 rows, not the whole table — no extra index needed.
 * Phase 2 also applies a content-type weight: user-guide tutorials rank
 * above OpenAPI endpoint records for the same similarity, so procedural
 * questions surface manual pages instead of raw API listings.
 */
import { getDal } from "../db/dal.js";
import { field, Filter, Project, type FilterExpr } from "@primebrick/dal-pg";
import { DocsKbEntity } from "../domain/entities/docs_kb_entity.js";

export interface DocsSearchResult {
  id: bigint;
  repo: string;
  path: string;
  title: string;
  chunk_idx: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  keyword_hits: number;
  /** ts_rank_cd of the full-text lexical channel (0 when absent). */
  lexical_score: number;
  score: number;
  /** True for chunks added by doc-graph expansion (outbound links of the
   *  top hits), not by vector rank — they bypass the FE similarity floor. */
  graph_expanded?: boolean;
  /** True for chunks recalled ONLY by the lexical channel (not in the
   *  vector top-N) whose FTS rank is strong — they bypass the FE
   *  similarity floor like graph_expanded ones. */
  lexical_match?: boolean;
}

/** Weight of each keyword hit in the final score (similarity units). */
const KEYWORD_BOOST = 0.05;
/** Weight of the full-text lexical rank in the final score — larger than
 *  the ILIKE boost: a real FTS match is a second recall channel, not just
 *  a tie-breaker inside vector candidates. */
const LEXICAL_BOOST = 0.15;
/** Minimum ts_rank_cd for a lexical-only candidate (absent from the vector
 *  top-N) to be kept and flagged `lexical_match` — below this the match is
 *  too weak to bypass the similarity floor. */
const LEX_MATCH_MIN = 0.1;
/** How many HNSW candidates to fetch before keyword re-ranking. */
const OVERSAMPLE = 4;

const KB_FIELDS = (["id", "repo", "path", "title", "chunk_idx", "content", "metadata"] as const)
  .map((k) => Project.field(field(DocsKbEntity, k)));

/** Row shape returned by the hybrid `vectorSearch` — KB projection plus
 *  the channel columns the builder adds on demand. */
type SearchRow = Pick<DocsKbEntity, "id" | "repo" | "path" | "title" | "chunk_idx" | "content" | "metadata"> & {
  similarity: number;
  keyword_hits?: number;
  lexical_score?: number;
  lexical_match?: boolean;
  score: number;
};

export async function searchDocsKb(
  opts: {
    embedding: number[];
    keywords?: string[];
    limit?: number;
    repo?: string;
    /** Corpus scoping applied INSIDE the candidate queries — a post-hoc
     *  caller-side filter would let out-of-scope docs saturate the top-N
     *  window before the filter runs (observed: manual RBAC page ranked
     *  ~21st behind dev/api docs, so the caller saw an empty result set). */
    path_prefix?: string;
    /** Similarity floor — graph expansion only follows links of hits that
     *  cleared it. Without it, an uncovered question would seed expansion
     *  from near-zero hits and inject unrelated context. */
    min_similarity?: number;
    /** Rank-tuning overrides — callers (e.g. the Guide cerebellum) may
     *  retune the retrieval balance per assistant; defaults below. */
    keyword_boost?: number;
    lexical_boost?: number;
    lex_match_min?: number;
    oversample?: number;
    graph_max_paths?: number;
  },
): Promise<DocsSearchResult[]> {
  const limit = Math.min(Math.max(opts.limit ?? 6, 1), 20);
  const keywords = (opts.keywords ?? [])
    .map((k) => k.trim())
    .filter((k) => k.length >= 2)
    .slice(0, 10);

  // Hybrid retrieval: the HNSW vector channel is unioned with a full-text
  // lexical channel (websearch_to_tsquery over the S0 keywords, 'simple'
  // dictionary — no stemming, safe for identifiers like `idp_code`).
  // Lexical-only rows enter the candidate set with their real similarity,
  // so exact-term docs the vectors miss can still surface; `similarity`
  // stays the floor metric, `lexical_score` only re-ranks.
  const lexQuery = keywords.join(" ").trim() || null;

  const filters: FilterExpr[] = [];
  if (opts.repo) filters.push(Filter.fieldValue(field(DocsKbEntity, "repo"), "=", opts.repo));
  if (opts.path_prefix) filters.push(Filter.fieldValue(field(DocsKbEntity, "path"), "LIKE", `${opts.path_prefix}%`));

  const rows = await getDal().vectorSearch<DocsKbEntity, SearchRow>(DocsKbEntity, field(DocsKbEntity, "embedding"), opts.embedding, {
    topK: limit,
    fields: [...KB_FIELDS],
    filters,
    oversample: Math.min(Math.max(opts.oversample ?? OVERSAMPLE, 1), 10),
    lexical: lexQuery
      ? {
          field: field(DocsKbEntity, "content"),
          query: lexQuery,
          config: "simple",
          boost: opts.lexical_boost ?? LEXICAL_BOOST,
          minScore: opts.lex_match_min ?? LEX_MATCH_MIN,
        }
      : undefined,
    keywordBoost: keywords.length
      ? {
          terms: keywords,
          fields: [field(DocsKbEntity, "title"), field(DocsKbEntity, "path"), field(DocsKbEntity, "content")],
          boost: opts.keyword_boost ?? KEYWORD_BOOST,
        }
      : undefined,
    scoreAdjust: {
      expr: "metadata->>'content_type'",
      map: { tutorial: 0.08, conceptual: 0.03, api: -0.10 },
    },
  });

  const hits = rows.map((row) => ({
    ...(row as unknown as Omit<DocsSearchResult, "score" | "similarity" | "keyword_hits" | "lexical_score" | "lexical_match">),
    similarity: Number(row.similarity),
    keyword_hits: Number(row.keyword_hits ?? 0),
    lexical_score: Number(row.lexical_score ?? 0),
    lexical_match: row.lexical_match === true,
    score: Number(row.score),
  }));

  const floor = opts.min_similarity ?? 0;
  const seeds = hits.filter((h) => h.similarity >= floor);
  return [
    ...hits,
    ...(await expandDocGraph(opts.embedding, seeds, opts.graph_max_paths)),
  ];
}

/**
 * Doc-graph expansion (Obsidian-style backlink following): every top hit's
 * declared outbound links (metadata.links, extracted at index time) are
 * followed — one best-matching chunk per linked page is appended. These are
 * structural correlations, not vector hits, so they carry their real
 * similarity but are flagged `graph_expanded` for the caller's thresholding.
 * Bounded: distinct linked paths are capped to keep the context sane.
 */
const GRAPH_MAX_PATHS = 6;
/** Upper bound on rows fetched for graph expansion — must cover every
 *  chunk of the ≤20 linked paths (DISTINCT ON semantics are reproduced in
 *  JS: the builder orders by distance, we keep the first row per path). */
const GRAPH_ROW_BUDGET = 512;

async function expandDocGraph(
  embedding: number[],
  hits: DocsSearchResult[],
  maxPaths: number = GRAPH_MAX_PATHS,
): Promise<DocsSearchResult[]> {
  const seen = new Set(hits.map((h) => h.path));
  const linked: string[] = [];
  for (const h of hits) {
    const links = h.metadata?.links;
    if (!Array.isArray(links)) continue;
    for (const p of links) {
      if (typeof p === "string" && !seen.has(p) && !linked.includes(p)) linked.push(p);
    }
  }
  const paths = linked.slice(0, Math.min(Math.max(maxPaths, 0), 20));
  if (!paths.length) return [];

  // DISTINCT ON (path) … ORDER BY path, distance — expressed as a filtered
  // vectorSearch + JS keep-best-per-path (identical winner semantics).
  const rows = await getDal().vectorSearch<DocsKbEntity, SearchRow>(DocsKbEntity, field(DocsKbEntity, "embedding"), embedding, {
    topK: GRAPH_ROW_BUDGET,
    fields: [...KB_FIELDS],
    filters: [Filter.fieldValue(field(DocsKbEntity, "path"), "IN", paths)],
  });

  const bestByPath = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    // Rows arrive ordered by distance — first seen per path is the winner.
    if (!bestByPath.has(row.path)) bestByPath.set(row.path, row);
  }

  return [...bestByPath.values()].map((row) => ({
    id: row.id,
    repo: row.repo,
    path: row.path,
    title: row.title,
    chunk_idx: row.chunk_idx,
    content: row.content,
    metadata: row.metadata as Record<string, unknown>,
    similarity: Number(row.similarity),
    keyword_hits: 0,
    lexical_score: 0,
    score: Number(row.similarity),
    graph_expanded: true,
  }));
}

/**
 * Fetch a whole document by (repo, path) — the `docs_fetch` tool backend
 * for the agentic guide loop: the model sees a cited path in an excerpt and
 * can dereference the FULL page, not just the retrieved chunk.
 * Chunks are re-joined in order; caller caps the content budget.
 */
export async function getDocByPath(
  params: { path: string; repo?: string },
): Promise<{ repo: string; path: string; title: string; content: string; metadata: Record<string, unknown> } | null> {
  const filters: FilterExpr[] = [Filter.fieldValue(field(DocsKbEntity, "path"), "=", params.path)];
  if (params.repo) filters.push(Filter.fieldValue(field(DocsKbEntity, "repo"), "=", params.repo));

  const rows = await getDal().findAll<DocsKbEntity, Pick<DocsKbEntity, "repo" | "path" | "title" | "content" | "metadata">>(
    DocsKbEntity,
    [Project.field(field(DocsKbEntity, "repo")), Project.field(field(DocsKbEntity, "path")), Project.field(field(DocsKbEntity, "title")), Project.field(field(DocsKbEntity, "content")), Project.field(field(DocsKbEntity, "metadata"))],
    {
      filters,
      sorting: [
        { field: field(DocsKbEntity, "repo"), dir: "ASC" },
        { field: field(DocsKbEntity, "chunk_idx"), dir: "ASC" },
      ],
    },
  ) as Awaited<Pick<DocsKbEntity, "repo" | "path" | "title" | "content" | "metadata">[]>;
  if (!rows.length) return null;
  const first = rows[0]!;
  // Same path can exist in several repos — when the caller omits `repo`,
  // return only the first repo's chunks (rows are ordered by repo).
  const content = rows
    .filter((r) => r.repo === first.repo)
    .map((r) => r.content)
    .join("\n\n");
  return { repo: first.repo, path: first.path, title: first.title, content, metadata: (first.metadata ?? {}) as Record<string, unknown> };
}

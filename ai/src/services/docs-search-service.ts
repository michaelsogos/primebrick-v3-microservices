/**
 * DocsSearchService — documentation KB vector search, owned by AI.
 *
 * Migrated from the BE's `modules/system/docs-search.service.ts`: the BE
 * used to call `POST /api/v1/ai/embed` over HTTP and then run pgvector SQL
 * against `ai.docs_kb` itself — both removed: the embedding provider and
 * the table live here, so `query` is embedded in-process and the search
 * runs against the service's own schema.
 */
import { getEmbeddingProvider } from "./embedding-provider.js";
import { searchDocsKb, getDocByPath, getDocsIndex } from "./docs-search-dal.js";

export class DocsSearchService {
  async search(params: {
    /** Raw query text — embedded in-process via the embedding provider. */
    query?: string;
    /** Pre-computed embedding (internal callers/tests). */
    embedding?: number[];
    keywords?: string[];
    limit?: number;
    repo?: string;
    path_prefix?: string;
    min_similarity?: number;
    keyword_boost?: number;
    lexical_boost?: number;
    lex_match_min?: number;
    oversample?: number;
    graph_max_paths?: number;
  }) {
    let embedding = params.embedding;
    if (!embedding && params.query) {
      const provider = await getEmbeddingProvider();
      embedding = await provider.embedQuery(params.query);
    }
    if (!embedding?.length) {
      throw new Error(
        "docs search requires either 'query' text or a precomputed 'embedding'",
      );
    }
    return searchDocsKb({ ...params, embedding });
  }

  async getDocument(params: { path: string; repo?: string }) {
    return getDocByPath(params);
  }

  /** Ordered repo→pages tree for the in-product docs browser. */
  async getIndex() {
    return getDocsIndex();
  }
}

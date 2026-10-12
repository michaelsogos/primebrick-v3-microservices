/**
 * Docs-pack ingestion — converts a pulled DocsPackPayload into LoadedDocs
 * and feeds the shared incremental ingest core.
 *
 * Scope: single-repo. Stale detection only removes docs_kb rows belonging
 * to the pack's repo that are absent from the pack — other repos' docs
 * are untouched. Same hash-diff semantics as the filesystem pipeline:
 * unchanged chunks are free, re-ingest on re-registration is cheap.
 */

import { logger, type DocsPackPayload } from "@primebrick/sdk";
import { loadedDocFromMdx, loadedDocsFromOpenApiSpec, type LoadedDoc } from "./docs-loader.js";
import { ingestLoadedDocs, type PipelineStats } from "./embedding-pipeline.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import { countDocs, deleteDoc, getAllDocPaths } from "./docs-kb-repository.js";

const DOC_EXT = /\.(mdx|md)$/i;

export async function ingestDocsPack(payload: DocsPackPayload): Promise<PipelineStats> {
  const startTime = Date.now();
  const repo = payload.manifest.repo;

  const docs: LoadedDoc[] = [];
  for (const file of payload.files) {
    if (!DOC_EXT.test(file.path)) continue; // _order.json, .gitkeep, …
    const doc = loadedDocFromMdx(repo, file.path, file.content);
    if (doc) docs.push(doc);
    else logger.warn(`docs-pack: skipped unparsable doc ${repo}/${file.path}`, { tags: ["docs-pack"] });
  }
  if (payload.openapi) {
    docs.push(...loadedDocsFromOpenApiSpec(`${repo}-openapi`, payload.openapi, repo));
  }

  const stats: PipelineStats = {
    docs_loaded: docs.length,
    chunks_created: 0,
    chunks_embedded: 0,
    chunks_skipped: 0,
    chunks_deleted: 0,
    errors: 0,
    total_in_db: 0,
    duration_ms: 0,
  };

  const provider = await getEmbeddingProvider();
  const processedPaths = new Set<string>();
  await ingestLoadedDocs(docs, provider, stats, processedPaths);

  // Repo-scoped stale deletion: remove this repo's docs that are no
  // longer shipped in its pack.
  for (const { repo: r, path } of await getAllDocPaths()) {
    if (r !== repo) continue;
    if (!processedPaths.has(`${r}:${path}`)) {
      await deleteDoc(r, path);
      stats.chunks_deleted++;
    }
  }

  stats.total_in_db = await countDocs();
  stats.duration_ms = Date.now() - startTime;
  return stats;
}

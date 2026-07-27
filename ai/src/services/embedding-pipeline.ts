/**
 * Embedding pipeline orchestrator.
 *
 * Reads docs (MDX + OpenAPI), chunks them, embeds each chunk, and upserts
 * into docs_kb with content_hash for incremental re-indexing.
 *
 * Only re-embeds chunks whose content_hash has changed (skip unchanged).
 * Deletes stale chunks (docs removed from source or chunks no longer present).
 */
import { loadMdxDocs, loadOpenApiSpecs, type LoadedDoc } from "./docs-loader.js";
import { chunkMarkdown } from "./chunking.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import {
  upsertDocChunk,
  getDocHashes,
  deleteStaleChunks,
  getAllDocPaths,
  deleteDoc,
  countDocs,
} from "./docs-kb-repository.js";
import { createHash } from "node:crypto";

export interface PipelineStats {
  docs_loaded: number;
  chunks_created: number;
  chunks_embedded: number;
  chunks_skipped: number;
  chunks_deleted: number;
  errors: number;
  total_in_db: number;
  duration_ms: number;
}

/**
 * Run the full embedding pipeline.
 *
 * @param docsPath Path to the docs pages directory (MDX files).
 * @param openApiPath Path to the OpenAPI specs directory (JSON files).
 */
export async function runEmbeddingPipeline(
  docsPath: string,
  openApiPath: string,
): Promise<PipelineStats> {
  const startTime = Date.now();
  const stats: PipelineStats = {
    docs_loaded: 0,
    chunks_created: 0,
    chunks_embedded: 0,
    chunks_skipped: 0,
    chunks_deleted: 0,
    errors: 0,
    total_in_db: 0,
    duration_ms: 0,
  };

  console.log(`[embedding-pipeline] Loading docs from: ${docsPath}`);
  console.log(`[embedding-pipeline] Loading OpenAPI from: ${openApiPath}`);

  const mdxDocs = loadMdxDocs(docsPath);
  const openApiDocs = loadOpenApiSpecs(openApiPath);
  const allDocs = [...mdxDocs, ...openApiDocs];
  stats.docs_loaded = allDocs.length;

  console.log(`[embedding-pipeline] Loaded ${mdxDocs.length} MDX docs + ${openApiDocs.length} OpenAPI endpoints`);

  const provider = await getEmbeddingProvider();
  console.log(`[embedding-pipeline] Embedding provider: ${provider.name} (${provider.dimension}-dim)`);

  // Track all (repo, path) pairs we process, to detect deleted docs later.
  const processedPaths = new Set<string>();
  // Collect chunks that need embedding (batch them for efficiency).
  const pendingEmbeddings: Array<{
    doc: LoadedDoc;
    chunk_idx: number;
    content: string;
    content_hash: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const doc of allDocs) {
    const pathKey = `${doc.repo}:${doc.path}`;
    processedPaths.add(pathKey);

    try {
      const chunks = chunkMarkdown(doc.content);
      const existingHashes = await getDocHashes(doc.repo, doc.path);
      const validIndices: number[] = [];

      for (const chunk of chunks) {
        validIndices.push(chunk.chunk_idx);
        const contentHash = createHash("sha256").update(chunk.content).digest("hex");
        const existingHash = existingHashes.get(chunk.chunk_idx);

        if (existingHash === contentHash) {
          stats.chunks_skipped++;
          continue;
        }

        stats.chunks_created++;
        pendingEmbeddings.push({
          doc,
          chunk_idx: chunk.chunk_idx,
          content: chunk.content,
          content_hash: contentHash,
          metadata: {
            ...doc.metadata,
            heading_path: extractHeadingPath(chunk.content),
          },
        });
      }

      // Mark stale chunks for deletion (chunks no longer in the source).
      // We do this after upsert, in the finalize step.
      await deleteStaleChunks(doc.repo, doc.path, validIndices);
    } catch (err) {
      stats.errors++;
      console.error(`[embedding-pipeline] Error processing ${pathKey}:`, err instanceof Error ? err.message : err);
    }
  }

  // Batch embed all pending chunks (in groups of 16 for memory efficiency).
  const BATCH_SIZE = 16;
  console.log(`[embedding-pipeline] Embedding ${pendingEmbeddings.length} chunks (batch size ${BATCH_SIZE})...`);

  for (let i = 0; i < pendingEmbeddings.length; i += BATCH_SIZE) {
    const batch = pendingEmbeddings.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await provider.embedBatch(batch.map((b) => b.content));

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        await upsertDocChunk({
          repo: item.doc.repo,
          path: item.doc.path,
          title: item.doc.title,
          chunk_idx: item.chunk_idx,
          content: item.content,
          embedding: embeddings[j],
          metadata: item.metadata,
        });
        stats.chunks_embedded++;
      }

      // Progress log every 5 batches
      if ((i / BATCH_SIZE) % 5 === 0 && i > 0) {
        console.log(`[embedding-pipeline] Progress: ${i}/${pendingEmbeddings.length} chunks embedded`);
      }
    } catch (err) {
      stats.errors++;
      console.error(`[embedding-pipeline] Batch embedding error at offset ${i}:`, err instanceof Error ? err.message : err);
    }
  }

  // Delete docs that are no longer in the source.
  const allDbPaths = await getAllDocPaths();
  for (const { repo, path } of allDbPaths) {
    const pathKey = `${repo}:${path}`;
    if (!processedPaths.has(pathKey)) {
      await deleteDoc(repo, path);
      stats.chunks_deleted++;
      console.log(`[embedding-pipeline] Deleted stale doc: ${pathKey}`);
    }
  }

  stats.total_in_db = await countDocs();
  stats.duration_ms = Date.now() - startTime;

  console.log(`[embedding-pipeline] Complete: ${stats.chunks_embedded} embedded, ${stats.chunks_skipped} skipped, ${stats.chunks_deleted} deleted, ${stats.total_in_db} total in DB, ${stats.duration_ms}ms`);

  return stats;
}

/**
 * Extract the first heading from a chunk as heading_path.
 */
function extractHeadingPath(content: string): string | undefined {
  const match = content.match(/^#{1,6}\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

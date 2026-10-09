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
import { buildEmbeddingInput, chunkMarkdown } from "./chunking.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import {
  upsertDocChunk,
  getDocHashes,
  deleteStaleChunks,
  getAllDocPaths,
  deleteDoc,
  countDocs,
  truncateDocsKb,
} from "./docs-kb-repository.js";
import { createHash } from "node:crypto";
import { logger } from "@primebrick/sdk";

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
  opts?: { full?: boolean },
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

  logger.info(`Loading docs from: ${docsPath}`, { tags: ["embedding-pipeline"] });
  logger.info(`Loading OpenAPI from: ${openApiPath}`, { tags: ["embedding-pipeline"] });

  const mdxDocs = loadMdxDocs(docsPath);
  const openApiDocs = loadOpenApiSpecs(openApiPath);
  const allDocs = [...mdxDocs, ...openApiDocs];
  stats.docs_loaded = allDocs.length;

  logger.info(`Loaded ${mdxDocs.length} MDX docs + ${openApiDocs.length} OpenAPI endpoints`, { tags: ["embedding-pipeline"] });

  const provider = await getEmbeddingProvider();
  logger.info(`Embedding provider: ${provider.name} (${provider.dimension}-dim)`, { tags: ["embedding-pipeline"] });

  // Explicit full reinit: wipe the index before the incremental loop.
  // Needed when the vector dimension/index shape changes (a hash mismatch
  // alone would upsert vectors of a different size into a fixed-width
  // column) and as a known-state recovery for a corrupted KB.
  if (opts?.full) {
    logger.info(`FULL mode — truncating docs_kb before re-embed`, { tags: ["embedding-pipeline"] });
    await truncateDocsKb();
  }

  // Track all (repo, path) pairs we process, to detect deleted docs later.
  const processedPaths = new Set<string>();
  // Collect chunks that need embedding (batch them for efficiency).
  const pendingEmbeddings: Array<{
    doc: LoadedDoc;
    chunk_idx: number;
    content: string;
    embedding_input: string;
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
        const heading_path =
          (chunk.metadata.heading_path as string | undefined) ??
          doc.metadata.heading_path;
        const embedding_input = buildEmbeddingInput(doc.title, heading_path, chunk.content, {
          description: doc.metadata.description,
          entity: doc.metadata.entity,
          content_type: doc.metadata.content_type,
        });
        // Hash covers the embedder identity: switching models must re-embed
        // every chunk (vectors from different models are incompatible spaces).
        // Links/entity are part of the hash: metadata-only doc edits must
        // re-upsert the chunks so their metadata stays in sync.
        const contentHash = createHash("sha256")
          .update(`${provider.name}\n${embedding_input}\n${JSON.stringify(doc.metadata.links ?? [])}\n${doc.metadata.entity ?? ""}`)
          .digest("hex");
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
          embedding_input,
          content_hash: contentHash,
          metadata: {
            ...doc.metadata,
            heading_path,
          },
        });
      }

      // Mark stale chunks for deletion (chunks no longer in the source).
      // We do this after upsert, in the finalize step.
      await deleteStaleChunks(doc.repo, doc.path, validIndices);
    } catch (err) {
      stats.errors++;
      logger.error(`Error processing ${pathKey}`, { tags: ["embedding-pipeline"], error: err instanceof Error ? err.message : err });
    }
  }

  // Batch embed all pending chunks (in groups of 16 for memory efficiency).
  const BATCH_SIZE = 16;
  logger.info(`Embedding ${pendingEmbeddings.length} chunks (batch size ${BATCH_SIZE})...`, { tags: ["embedding-pipeline"] });

  for (let i = 0; i < pendingEmbeddings.length; i += BATCH_SIZE) {
    const batch = pendingEmbeddings.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await provider.embedBatch(batch.map((b) => b.embedding_input));

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        await upsertDocChunk({
          repo: item.doc.repo,
          path: item.doc.path,
          title: item.doc.title,
          chunk_idx: item.chunk_idx,
          content: item.content,
          content_hash: item.content_hash,
          embedding: embeddings[j],
          metadata: item.metadata,
        });
        stats.chunks_embedded++;
      }

      // Progress log every 5 batches
      if ((i / BATCH_SIZE) % 5 === 0 && i > 0) {
        logger.info(`Progress: ${i}/${pendingEmbeddings.length} chunks embedded`, { tags: ["embedding-pipeline"] });
      }
    } catch (err) {
      stats.errors++;
      logger.error(`Batch embedding error at offset ${i}`, { tags: ["embedding-pipeline"], error: err instanceof Error ? err.message : err });
    }
  }

  // Delete docs that are no longer in the source.
  const allDbPaths = await getAllDocPaths();
  for (const { repo, path } of allDbPaths) {
    const pathKey = `${repo}:${path}`;
    if (!processedPaths.has(pathKey)) {
      await deleteDoc(repo, path);
      stats.chunks_deleted++;
      logger.info(`Deleted stale doc: ${pathKey}`, { tags: ["embedding-pipeline"] });
    }
  }

  stats.total_in_db = await countDocs();
  stats.duration_ms = Date.now() - startTime;

  logger.info(`Complete: ${stats.chunks_embedded} embedded, ${stats.chunks_skipped} skipped, ${stats.chunks_deleted} deleted, ${stats.total_in_db} total in DB, ${stats.duration_ms}ms`, { tags: ["embedding-pipeline"] });

  return stats;
}
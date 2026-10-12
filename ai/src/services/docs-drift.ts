/**
 * Docs drift check — compares what the services' packs *would* index
 * against what `docs_kb` actually contains. Same chunking + hashing as
 * `ingestDocsPack`/`ingestLoadedDocs`, minus the writes: if the ingest
 * semantics ever change, the drift definition follows automatically.
 *
 * Answers "is the index aligned with the shipped docs?" — the semantic
 * "would the guide find it?" is the search probe in the same module.
 */

import { logger, type DocsPackPayload } from "@primebrick/sdk";
import { createHash } from "node:crypto";
import { loadedDocFromMdx, loadedDocsFromOpenApiSpec } from "./docs-loader.js";
import { chunkMarkdown, buildEmbeddingInput } from "./chunking.js";
import { getEmbeddingProvider } from "./embedding-provider.js";
import { getDocHashes, getAllDocPaths, vectorSearch } from "./docs-kb-repository.js";

const DOC_EXT = /\.(mdx|md)$/i;

export interface DocsDrift {
  /** Docs the pack ships (source-of-truth quantity). */
  expected_docs: number;
  /** Chunks the pack would produce (source-of-truth quantity). */
  expected_chunks: number;
  /** `repo:path` shipped by a pack but with zero rows in docs_kb. */
  missing_from_index: string[];
  /** `repo:path` whose expected chunk hash set differs from the DB one. */
  stale: string[];
  /** `repo:path` indexed but no longer shipped by its pack (repo-scoped). */
  orphans: string[];
  /** Chunks indexed without an embedding — invisible to retrieval. */
  unembedded_chunks: number;
}

/** Recompute the expected (chunk_idx → content_hash) set for one pack. */
async function expectedHashes(payload: DocsPackPayload): Promise<Map<string, Map<number, string>>> {
  const repo = payload.manifest.repo;
  const provider = await getEmbeddingProvider();
  const out = new Map<string, Map<number, string>>();

  const docs = [
    ...payload.files
      .filter((f) => DOC_EXT.test(f.path))
      .map((f) => loadedDocFromMdx(repo, f.path, f.content))
      .filter((d): d is NonNullable<typeof d> => d !== null),
    ...(payload.openapi ? loadedDocsFromOpenApiSpec(`${repo}-openapi`, payload.openapi, repo) : []),
  ];

  for (const doc of docs) {
    const hashes = new Map<number, string>();
    for (const chunk of chunkMarkdown(doc.content)) {
      const heading_path =
        (chunk.metadata.heading_path as string | undefined) ?? doc.metadata.heading_path;
      const embedding_input = buildEmbeddingInput(doc.title, heading_path, chunk.content, {
        description: doc.metadata.description,
        entity: doc.metadata.entity,
        content_type: doc.metadata.content_type,
      });
      const contentHash = createHash("sha256")
        .update(`${provider.name}\n${embedding_input}\n${JSON.stringify(doc.metadata.links ?? [])}\n${doc.metadata.entity ?? ""}`)
        .digest("hex");
      hashes.set(chunk.chunk_idx, contentHash);
    }
    out.set(doc.path, hashes);
  }
  return out;
}

export async function computeDocsDrift(payload: DocsPackPayload): Promise<DocsDrift> {
  const repo = payload.manifest.repo;
  const expected = await expectedHashes(payload);
  const drift: DocsDrift = {
    expected_docs: expected.size,
    expected_chunks: [...expected.values()].reduce((n, m) => n + m.size, 0),
    missing_from_index: [],
    stale: [],
    orphans: [],
    unembedded_chunks: 0,
  };

  for (const [path, hashes] of expected) {
    const db = await getDocHashes(repo, path);
    if (db.size === 0) {
      drift.missing_from_index.push(`${repo}:${path}`);
      continue;
    }
    const same =
      db.size === hashes.size && [...hashes].every(([idx, h]) => db.get(idx) === h);
    if (!same) drift.stale.push(`${repo}:${path}`);
  }

  for (const { repo: r, path } of await getAllDocPaths()) {
    if (r === repo && !expected.has(path)) drift.orphans.push(`${r}:${path}`);
  }
  return drift;
}

export interface SearchProbeResult {
  query: string;
  expect_path_includes: string;
  ok: boolean;
  top: Array<{ repo: string; path: string; similarity: number }>;
}

/**
 * Semantic probe: embed a canonical query and check an expected doc
 * actually lands in top-k — the end-to-end "would the guide find it?"
 * check. Probes are data, not code: add/remove in CANONICAL_PROBES.
 */
export const CANONICAL_PROBES: Array<{ query: string; expect_path_includes: string }> = [
  { query: "create a new user", expect_path_includes: "user" },
  { query: "modules and navigation", expect_path_includes: "module" },
];

export async function runSearchProbes(
  probes: Array<{ query: string; expect_path_includes: string }> = CANONICAL_PROBES,
  topK = 5,
): Promise<SearchProbeResult[]> {
  const provider = await getEmbeddingProvider();
  const results: SearchProbeResult[] = [];
  for (const p of probes) {
    try {
      const [embedding] = await provider.embedBatch([p.query]);
      const hits = await vectorSearch(embedding, topK);
      const top = hits.map((h) => ({
        repo: h.repo,
        path: h.path,
        similarity: Number(h.similarity.toFixed(4)),
      }));
      results.push({
        ...p,
        ok: top.some((t) => t.path.toLowerCase().includes(p.expect_path_includes)),
        top,
      });
    } catch (err) {
      logger.warn(`search probe failed for "${p.query}"`, {
        tags: ["docs-drift"],
        error: err instanceof Error ? err.message : err,
      });
      results.push({ ...p, ok: false, top: [] });
    }
  }
  return results;
}

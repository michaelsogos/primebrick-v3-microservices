import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load_mdx_docs: vi.fn(),
  load_openapi_specs: vi.fn(),
  embed_batch: vi.fn(),
  get_doc_hashes: vi.fn(),
  insert_doc_chunks: vi.fn(),
  update_doc_chunks: vi.fn(),
  delete_stale_chunks: vi.fn(),
  get_all_doc_paths: vi.fn(),
  delete_doc: vi.fn(),
  count_docs: vi.fn(),
}));

vi.mock('../src/services/docs-loader.js', () => ({
  loadMdxDocs: mocks.load_mdx_docs,
  loadOpenApiSpecs: mocks.load_openapi_specs,
}));
vi.mock('../src/services/embedding-provider.js', () => ({
  getEmbeddingProvider: async () => ({
    name: 'test-provider',
    dimension: 384,
    embed: vi.fn(),
    embedBatch: mocks.embed_batch,
  }),
}));
vi.mock('../src/services/docs-kb-repository.js', () => ({
  insertDocChunks: mocks.insert_doc_chunks,
  updateDocChunks: mocks.update_doc_chunks,
  getDocHashes: mocks.get_doc_hashes,
  deleteStaleChunks: mocks.delete_stale_chunks,
  getAllDocPaths: mocks.get_all_doc_paths,
  deleteDoc: mocks.delete_doc,
  countDocs: mocks.count_docs,
}));

import { runEmbeddingPipeline } from '../src/services/embedding-pipeline.js';

const doc = {
  repo: 'backend',
  path: 'backend/guide/rbac.mdx',
  title: 'RBAC',
  content: '# Default roles\n\nThe administrators role bypasses permission checks.',
  metadata: {
    source: 'mdx' as const,
    repo: 'backend',
    path: 'backend/guide/rbac.mdx',
    title: 'RBAC',
    content_type: 'tutorial' as const,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load_mdx_docs.mockReturnValue([doc]);
  mocks.load_openapi_specs.mockReturnValue([]);
  mocks.embed_batch.mockImplementation(async (texts: string[]) =>
    texts.map(() => Array(384).fill(0.1)),
  );
  mocks.get_doc_hashes.mockResolvedValue(new Map());
  mocks.insert_doc_chunks.mockResolvedValue(undefined);
  mocks.update_doc_chunks.mockResolvedValue(undefined);
  mocks.delete_stale_chunks.mockResolvedValue(undefined);
  mocks.get_all_doc_paths.mockResolvedValue([{ repo: doc.repo, path: doc.path }]);
  mocks.delete_doc.mockResolvedValue(undefined);
  mocks.count_docs.mockResolvedValue(1);
});

describe('embedding input and incremental reindex', () => {
  it('embeds title + heading + content but stores only the original chunk as content', async () => {
    await runEmbeddingPipeline('/docs', '/openapi');

    // Contextual preamble: title is wrapped as Document: "..." (content_type)
    // and the heading becomes a `Section:` line (see buildEmbeddingInput).
    const expected_input = `Document: "RBAC" (tutorial)\n\nSection: Default roles\n\n${doc.content}`;
    const expected_hash = createHash('sha256')
      .update(`test-provider\n${expected_input}\n[]\n`)
      .digest('hex');
    // Second embedded input: the chunk_idx=-1 doc-source row embeds the bare
    // title (display-only row, never a search hit).
    expect(mocks.embed_batch).toHaveBeenCalledWith([expected_input, 'RBAC']);
    expect(mocks.insert_doc_chunks).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'RBAC',
        content: doc.content,
        content_hash: expected_hash,
        metadata: expect.objectContaining({ heading_path: 'Default roles' }),
      }),
      expect.objectContaining({
        chunk_idx: -1,
        content: doc.content,
        metadata: expect.objectContaining({ doc_source: true }),
      }),
    ]);
  });

  it('re-embeds a same-content chunk when its title changed', async () => {
    const first_input = `Document: "RBAC" (tutorial)\n\nSection: Default roles\n\n${doc.content}`;
    mocks.get_doc_hashes.mockResolvedValueOnce(
      new Map([
        [0, createHash('sha256').update(`test-provider\n${first_input}\n[]\n`).digest('hex')],
      ]),
    );
    mocks.load_mdx_docs.mockReturnValueOnce([{ ...doc, title: 'Access Control' }]);

    const stats = await runEmbeddingPipeline('/docs', '/openapi');

    // Chunk 0 re-embeds (title changed) + the new doc-source row embeds.
    expect(stats.chunks_embedded).toBe(2);
    expect(stats.chunks_skipped).toBe(0);
    expect(mocks.embed_batch).toHaveBeenCalledWith([
      `Document: "Access Control" (tutorial)\n\nSection: Default roles\n\n${doc.content}`,
      'Access Control',
    ]);
  });
});

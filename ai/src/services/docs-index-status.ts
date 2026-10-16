/**
 * Docs-index admin status — the service behind
 * `GET /api/v1/ai/docs/index-status`. Pure `(input) → result`: per-repo KB
 * inventory (docs/chunks/unembedded/content+vector bytes), source-vs-index
 * drift per service pack, append-only ingest history, and optional search
 * probes. All reads go through the DAL (`findAll`/`findByPage`/`find` with
 * DSL projections) — no raw pool access.
 */
import { field, Filter, Project, Sort } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import { DocsKbEntity } from "../domain/entities/docs_kb_entity.js";
import { DocsIngestLogEntity } from "../domain/entities/docs_ingest_log_entity.js";
import { pullAllPacks } from "./docs-pack-reindex.js";
import { computeDocsDrift, runSearchProbes } from "./docs-drift.js";

export interface DocsIndexStatus {
  repos: Array<{
    repo: string;
    docs: bigint;
    chunks: bigint;
    unembedded_chunks: bigint;
    content_bytes: bigint;
    vector_bytes: bigint;
  }>;
  drift: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  probes?: Awaited<ReturnType<typeof runSearchProbes>>;
  storage: { total_bytes: bigint } | null;
}

export async function getDocsIndexStatus(opts: { probe?: boolean } = {}): Promise<DocsIndexStatus> {
  const dal = getDal();

  // Aggregates are INT8 → bigint on the DAL parser and stay bigint on the
  // wire: the rpc-router serializes with extJsonStringify and the FE decodes
  // every integer to native bigint. No Number() normalization — ever.
  const repos = (await dal.findAll<
    DocsKbEntity,
    DocsIndexStatus["repos"][number]
  >(
    DocsKbEntity,
    [
      Project.field(field(DocsKbEntity, "repo")),
      Project.expr("COUNT(DISTINCT path)", "docs"),
      Project.expr("COUNT(*)", "chunks"),
      Project.expr("COUNT(*) FILTER (WHERE embedding IS NULL)", "unembedded_chunks"),
      Project.expr("COALESCE(SUM(LENGTH(content)), 0)", "content_bytes"),
      Project.expr("COALESCE(SUM(pg_column_size(embedding)), 0)", "vector_bytes"),
    ],
    {
      groupBy: [field(DocsKbEntity, "repo")],
      sorting: [Sort.by(field(DocsKbEntity, "repo"), "ASC")],
    },
  )) as DocsIndexStatus["repos"];

  const historyPage = await dal.findByPage<DocsIngestLogEntity>(DocsIngestLogEntity, 1, 20, null, {
    sorting: [Sort.by(field(DocsIngestLogEntity, "created_at"), "DESC")],
  });
  const history = historyPage.entities as unknown as Array<Record<string, unknown>>;

  const storage = (await dal.find<DocsKbEntity, { total_bytes: bigint }>(DocsKbEntity, [
    Project.expr("pg_total_relation_size('ai.docs_kb')", "total_bytes"),
  ]));

  const packs = await pullAllPacks();
  const drift = await Promise.all(
    packs.map(async (p) => {
      if (!p.payload) return { service: p.service, error: p.error };
      const d = await computeDocsDrift(p.payload);
      return { service: p.service, repo: p.payload.manifest.repo, ...d };
    }),
  );

  const probes = opts.probe ? await runSearchProbes() : undefined;
  return { repos, drift, history, probes, storage };
}

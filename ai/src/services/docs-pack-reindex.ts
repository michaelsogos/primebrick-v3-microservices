/**
 * Docs-pack re-pull/reindex — the shared logic behind every "go fetch the
 * packs again" trigger: lifecycle subscriber events, the admin reindex
 * endpoint, and the dev `docs:reindex` script. One code path so ingest
 * behaviour (fetch → hash-diff → repo-scoped stale delete → ingest log)
 * can never drift between triggers.
 */
import { logger, fetchDocsPack, type DocsPackPayload } from "@primebrick/sdk";
import { ingestDocsPack } from "./docs-pack-ingest.js";
import type { PipelineStats } from "./embedding-pipeline.js";
import { getDal } from "../db/dal.js";
import { aiConfig } from "../config/ai-config.js";

export type DocsIngestTrigger =
  | "startup"
  | "register"
  | "gateway_online"
  | "manual"
  | "dev_script";

export interface ReindexResult {
  service: string;
  repo?: string;
  ok: boolean;
  stats?: PipelineStats;
  error?: string;
}

/** Persist one row per ingest run — admin "perché, da chi, quando" history. */
async function logDocsIngest(
  serviceCode: string,
  repo: string | undefined,
  trigger: DocsIngestTrigger,
  stats: PipelineStats | undefined,
  error: string | undefined,
): Promise<void> {
  try {
    await getDal()
      .getPool()
      .query(
        `INSERT INTO ai.docs_ingest_log (repo, service_code, trigger_source, ok, stats, error)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [repo ?? null, serviceCode, trigger, error == null, stats ?? {}, error ?? null],
      );
  } catch (err) {
    logger.warn(`docs_ingest_log write failed: ${err instanceof Error ? err.message : err}`, { tags: ["docs-pack"] });
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry-bounded pack pull + ingest. The gateway_online → pull race loses
 * when the BE rotates the client-shield secret at boot: the pull fires
 * before `secret.rotated` reaches this service → 401 → without a retry the
 * pack (and its KB corpus) would stay stale until the next lifecycle event.
 */
export async function pullAndIngest(
  baseUrl: string,
  serviceCode: string,
  trigger: DocsIngestTrigger = "register",
): Promise<ReindexResult> {
  const MAX_ATTEMPTS = 6;
  for (let attempt = 1; ; attempt++) {
    try {
      const payload = await fetchDocsPack(baseUrl);
      const stats = await ingestDocsPack(payload);
      logger.info(
        `Ingested the documentation pack of service ${serviceCode} — ${stats.chunks_embedded} chunks embedded, ${stats.chunks_skipped} unchanged, ${stats.chunks_deleted} removed (${stats.docs_loaded} docs, repo "${payload.manifest.repo}")`,
        { tags: ["docs-pack"] },
      );
      await logDocsIngest(serviceCode, payload.manifest.repo, trigger, stats, undefined);
      return { service: serviceCode, repo: payload.manifest.repo, ok: true, stats };
    } catch (err) {
      if (attempt >= MAX_ATTEMPTS) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(
          `Failed to pull or ingest the documentation pack of service ${serviceCode} at ${baseUrl} after ${MAX_ATTEMPTS} attempts`,
          { tags: ["docs-pack"], error: message },
        );
        await logDocsIngest(serviceCode, undefined, trigger, undefined, message);
        return { service: serviceCode, ok: false, error: message };
      }
      logger.warn(
        `docs-pack pull of ${serviceCode} failed (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${attempt * 5}s`,
        { tags: ["docs-pack"], error: err instanceof Error ? err.message : err },
      );
      await sleep(attempt * 5000);
    }
  }
}

/**
 * Re-pull every live service that exposes the `docs_pack` capability plus
 * the BE itself (the BE never publishes service.register — it IS the
 * registry). `repo` narrows to one pack for targeted rebuilds.
 */
/** Live services that ship a docs pack, BE first (it never registers — it IS the registry). */
async function docsPackTargets(beBaseUrl?: string): Promise<Array<{ code: string; base_url: string }>> {
  const { rows } = await getDal()
    .getPool()
    .query<{ code: string; base_url: string }>(
      `SELECT code, base_url FROM public.service_registry
        WHERE status = 'online' AND is_enabled = true
          AND capabilities ? 'docs_pack'`,
    );
  return [
    { code: "backend", base_url: beBaseUrl ?? aiConfig("be_base_url") ?? "http://localhost:3001" },
    ...rows,
  ];
}

export async function reindexDocsPacks(
  opts: { repo?: string; trigger?: DocsIngestTrigger; beBaseUrl?: string } = {},
): Promise<ReindexResult[]> {
  const trigger = opts.trigger ?? "manual";
  const results: ReindexResult[] = [];
  for (const s of await docsPackTargets(opts.beBaseUrl)) {
    const r = await pullAndIngest(s.base_url, s.code, trigger);
    if (opts.repo && r.repo && r.repo !== opts.repo) continue;
    results.push(r);
  }
  return results;
}

export interface PulledPack {
  service: string;
  payload?: DocsPackPayload;
  error?: string;
}

/**
 * Fetch every live pack WITHOUT ingesting — the source side of the drift
 * check. Fail-fast per service (no retry): a status call reports the
 * error, it does not repair it.
 */
export async function pullAllPacks(opts: { beBaseUrl?: string } = {}): Promise<PulledPack[]> {
  const out: PulledPack[] = [];
  for (const s of await docsPackTargets(opts.beBaseUrl)) {
    try {
      out.push({ service: s.code, payload: await fetchDocsPack(s.base_url) });
    } catch (err) {
      out.push({ service: s.code, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return out;
}

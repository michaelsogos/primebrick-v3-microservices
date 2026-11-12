/**
 * Domain contracts persisted as jsonb entity props.
 *
 * Each class is the runtime type of one (or more) entity columns: the
 * entity declares `@Column({ jsType: <Class> })` and hydration revives the
 * jsonb payload to a real instance (`cls.fromJson` when exposed, else
 * prototype graft — `Object.assign(Object.create(cls.prototype), v)`).
 * Map-typed props (`Record<string, X>`) stay plain objects and declare
 * `pgType:"jsonb"` — the entry class documents the element schema.
 *
 * Field vocabularies come from real write sites — nothing aspirational.
 */

/**
 * `ai_models.execution_config` / `ai_cerebellum.execution_config` —
 * execution tuning the FE worker reads. On cerebellum rows the same class
 * is a PARTIAL override merged over the model's row (all fields optional).
 * Field evidence: `use-ai-assistant.svelte.ts`, `use-regex-ai.svelte.ts`,
 * `ai-worker.ts` LoadPayload.
 */
export class ExecutionConfig {
  /** KV cache reuse across turns — verified empirically by the harness. */
  kv_cache_reuse?: boolean;
  /** Conversation memory: keep only the last N turns of history. */
  sliding_window?: boolean;
  /** History turns kept when sliding_window is on. */
  max_history_turns?: number;
  /** Route the turn through the intent-detection step before generation. */
  intent_detection?: boolean;
  /** ORT session options — snake_case keys camelized before
   *  InferenceSession.create (FE worker folds them into LoadPayload). */
  ort_session_options?: Record<string, unknown>;
}

/**
 * `ai_models.working_set_detail` — provenance breakdown of working_set_mb.
 * `e2e_measured` rows carry the measured fields; `hf_estimate` rows may add
 * the estimate inputs (weights_mb/kv_mb/ctx_ref) per the entity doc.
 */
export class WorkingSetDetail {
  /** Estimate inputs — `hf_estimate` provenance only. */
  weights_mb?: number;
  kv_mb?: number;
  ctx_ref?: number;
  /** GPUBuffer-tracked total at measure time — `e2e_measured` provenance. */
  measured_vram_bytes?: number;
  measured_at?: string;
  measured_ctx_tokens?: number | null;
}

/** One measured turn inside a test_scores case (`E2ETurn` in
 *  `src/e2e/helpers/test-scores.ts` on the FE side — kept in sync by the
 *  persisted contract, not by import). */
export class AiTestScoreTurn {
  n!: number;
  /** "conversation" | "navigation" — which session/spec produced the turn. */
  phase?: string;
  prompt!: string;
  expected!: string;
  actual?: unknown;
  score!: number;
  verdict!: "pass" | "partial" | "fail";
  reason!: string;
  response_s!: number;
}

/** History snapshot of a case before overwrite — newest-first, capped at 5. */
export class AiTestScoreSnapshot {
  tested_at?: string;
  turns?: AiTestScoreTurn[];
  success_count?: number | null;
  total_turns?: number;
  phases?: Record<string, { tested_at: string; turns: number }>;
}

/**
 * `ai_models.test_scores` / `ai_cerebellum.test_scores` — one case keyed by
 * `<case>_test_score`. The prop itself is `Record<string, AiTestScore>`;
 * this class is the entry schema (write site: `test-scores.ts`).
 */
export class AiTestScore {
  /** Harness protocol that produced the measurement. */
  protocol?: string;
  tested_at?: string;
  load_ok?: boolean;
  generation_ok?: boolean;
  turns?: AiTestScoreTurn[];
  /** Previous runs, newest-first — capped at 5 by the writer. */
  history?: AiTestScoreSnapshot[];
  /** Per-phase summary: phase → { tested_at, turns }. */
  phases?: Record<string, { tested_at: string; turns: number }>;
  success_count?: number;
  total_turns?: number;
}

/**
 * `ai_messages.content` — role-keyed vocabulary. Which fields are present
 * depends on `role`: `user` → `{text}`, `assistant` → `{text, tool_calls,
 * tool_results}`, `tool` → `{tool_call_id, tool_name, output}`.
 */
export class MessageContent {
  text?: string;
  /** Assistant turn — ai-sdk tool-call/tool-result payloads. */
  tool_calls?: unknown[];
  tool_results?: unknown[];
  /** Tool-result rows — correlated back by the caller's loop. */
  tool_call_id?: string;
  tool_name?: string;
  output?: unknown;
}

/**
 * `docs_kb.metadata` — the `LoadedDoc["metadata"]` shape persisted per chunk
 * (promoted from the inline object type in `docs-loader.ts`).
 */
export class DocMetadata {
  source!: "mdx" | "openapi";
  repo!: string;
  path!: string;
  title!: string;
  content_type!: "tutorial" | "reference" | "conceptual" | "api";
  heading_path?: string;
  entity?: string;
  endpoint?: string;
  /** Frontmatter description — fed into the contextual embedding preamble. */
  description?: string;
  /** KB paths this doc links to (doc-graph expansion — MDX only). */
  links?: string[];
  /** `_order.json` manifest rows — ordering metadata for the docs index,
   *  not real pages. Excluded from search/index consumers. */
  order_manifest?: boolean;
}

/**
 * `docs_ingest_log.stats` — PipelineStats snapshot (moved here from
 * `embedding-pipeline.ts` — the persisted contract lives at domain level;
 * the pipeline accumulates it, the ingest log persists it).
 */
export class PipelineStats {
  docs_loaded!: number;
  chunks_created!: number;
  chunks_embedded!: number;
  chunks_skipped!: number;
  chunks_deleted!: number;
  errors!: number;
  total_in_db!: number;
  duration_ms!: number;
}

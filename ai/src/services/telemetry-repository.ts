/**
 * Telemetry persistence — per-request metrics for the AI orchestrator.
 *
 * Uses raw SQL on the public.ai_telemetry table (created by the BE's
 * init_database.sql patch). Follows the same pattern as conversation-repository.ts.
 */
import { getDal } from "../db/dal.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TelemetryRow {
  uuid: string;
  conversation_uuid: string | null;
  user_uuid: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  steps: number;
  tool_calls: number;
  rag_hits: number;
  latency_ms: number;
  success: boolean;
  error: string | null;
  created_at: Date;
}

export interface TelemetryStats {
  total_requests: bigint;
  successful: bigint;
  failed: bigint;
  total_tokens_in: bigint;
  total_tokens_out: bigint;
  avg_latency_ms: number;
  total_tool_calls: bigint;
  total_rag_hits: bigint;
}

// ─── Repository ──────────────────────────────────────────────────────────────

export async function insertTelemetry(opts: {
  conversation_uuid?: string;
  user_uuid: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  steps: number;
  tool_calls: number;
  rag_hits: number;
  latency_ms: number;
  success: boolean;
  error?: string;
}): Promise<TelemetryRow> {
  const pool = getDal().getPool();
  const result = await pool.query<TelemetryRow>(
    `INSERT INTO ai_telemetry
       (conversation_uuid, user_uuid, model, tokens_in, tokens_out,
        steps, tool_calls, rag_hits, latency_ms, success, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING uuid, conversation_uuid, user_uuid, model, tokens_in, tokens_out,
       steps, tool_calls, rag_hits, latency_ms, success, error, created_at`,
    [
      opts.conversation_uuid ?? null,
      opts.user_uuid,
      opts.model,
      opts.tokens_in,
      opts.tokens_out,
      opts.steps,
      opts.tool_calls,
      opts.rag_hits,
      opts.latency_ms,
      opts.success,
      opts.error ?? null,
    ],
  );
  return result.rows[0]!;
}

export async function getTelemetryStats(): Promise<TelemetryStats> {
  const pool = getDal().getPool();
  const result = await pool.query<{
    total_requests: string;
    successful: string;
    failed: string;
    total_tokens_in: string;
    total_tokens_out: string;
    avg_latency_ms: string;
    total_tool_calls: string;
    total_rag_hits: string;
  }>(
    `SELECT
       COUNT(*)::text AS total_requests,
       COUNT(*) FILTER (WHERE success)::text AS successful,
       COUNT(*) FILTER (WHERE NOT success)::text AS failed,
       COALESCE(SUM(tokens_in), 0)::text AS total_tokens_in,
       COALESCE(SUM(tokens_out), 0)::text AS total_tokens_out,
       COALESCE(AVG(latency_ms), 0)::text AS avg_latency_ms,
       COALESCE(SUM(tool_calls), 0)::text AS total_tool_calls,
       COALESCE(SUM(rag_hits), 0)::text AS total_rag_hits
     FROM ai_telemetry`,
  );
  const row = result.rows[0]!;
  return {
    total_requests: BigInt(row.total_requests ?? 0),
    successful: BigInt(row.successful ?? 0),
    failed: BigInt(row.failed ?? 0),
    total_tokens_in: BigInt(row.total_tokens_in ?? 0),
    total_tokens_out: BigInt(row.total_tokens_out ?? 0),
    avg_latency_ms: Number(row.avg_latency_ms ?? 0),
    total_tool_calls: BigInt(row.total_tool_calls ?? 0),
    total_rag_hits: BigInt(row.total_rag_hits ?? 0),
  };
}

export async function listRecentTelemetry(limit: number = 50): Promise<TelemetryRow[]> {
  const pool = getDal().getPool();
  const result = await pool.query<TelemetryRow>(
    `SELECT uuid, conversation_uuid, user_uuid, model, tokens_in, tokens_out,
       steps, tool_calls, rag_hits, latency_ms, success, error, created_at
     FROM ai_telemetry
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

/**
 * TelemetryService — `ai_telemetry` persistence on `DomainService`
 * (was `telemetry-repository.ts`). Per-request metrics for the AI
 * orchestrator.
 *
 * Entity-backed on `ai.ai_telemetry` (AiTelemetryEntity) — no raw SQL:
 * inserts go through `svc.create`, stats through `Project.expr`
 * aggregates, recent listing through `findByPage` + sort.
 * AiTelemetryEntity is NOT auditable — `user_uuid` is a domain column,
 * stamped from the request actor by the caller.
 */
import { DomainService, field, Project, Sort } from "@primebrick/dal-pg";
import { runWithSession } from "@primebrick/sdk";
import { actorSession, entityActor } from "../db/entity-repo.js";
import { AiTelemetryEntity } from "../domain/entities/ai_telemetry_entity.js";

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

// ─── Service ─────────────────────────────────────────────────────────────────

const TELEMETRY_FIELDS = (
  ["uuid", "conversation_uuid", "user_uuid", "model", "tokens_in", "tokens_out",
    "steps", "tool_calls", "rag_hits", "latency_ms", "success", "error", "created_at"] as const
).map((k) => Project.field(field(AiTelemetryEntity, k)));

type TelemetryT = AiTelemetryEntity & Record<string, unknown>;

export class TelemetryService extends DomainService<TelemetryT> {
  constructor() {
    super({
      entity: AiTelemetryEntity as never,
      actor: entityActor,
      // Telemetry is internal — RPC-served stats only, no search surface.
      list: { searchableKeys: [], filterableKeys: new Set() },
    });
  }

  async insertTelemetry(opts: {
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
    // svc.create resolves the actor eagerly — the caller's identity
    // (user_uuid) rides ALS for the duration of the write even though
    // the entity itself is not auditable.
    return await runWithSession(actorSession(opts.user_uuid), () =>
      this.svc.create({
        conversation_uuid: opts.conversation_uuid ?? null,
        user_uuid: opts.user_uuid,
        model: opts.model,
        tokens_in: opts.tokens_in,
        tokens_out: opts.tokens_out,
        steps: opts.steps,
        tool_calls: opts.tool_calls,
        rag_hits: opts.rag_hits,
        latency_ms: opts.latency_ms,
        success: opts.success,
        error: opts.error ?? null,
      }) as Promise<TelemetryRow>);
  }

  async getTelemetryStats(): Promise<TelemetryStats> {
    const rows = (await this.svc.query<Record<string, string>>([
      Project.expr("COUNT(*)::text", "total_requests"),
      Project.expr("COUNT(*) FILTER (WHERE success)::text", "successful"),
      Project.expr("COUNT(*) FILTER (WHERE NOT success)::text", "failed"),
      Project.expr("COALESCE(SUM(tokens_in), 0)::text", "total_tokens_in"),
      Project.expr("COALESCE(SUM(tokens_out), 0)::text", "total_tokens_out"),
      Project.expr("COALESCE(AVG(latency_ms), 0)::text", "avg_latency_ms"),
      Project.expr("COALESCE(SUM(tool_calls), 0)::text", "total_tool_calls"),
      Project.expr("COALESCE(SUM(rag_hits), 0)::text", "total_rag_hits"),
    ]));
    const row = rows[0] ?? {};
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

  async listRecentTelemetry(limit: number = 50): Promise<TelemetryRow[]> {
    const r = await this.svc.list({
      sort_key: "created_at",
      sort_dir: "desc",
      page: 1,
      page_size: limit,
    });
    return r.rows as unknown as TelemetryRow[];
  }
}

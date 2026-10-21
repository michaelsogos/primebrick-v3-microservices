/**
 * actions-route — the two non-entity endpoints the jobs admin page needs:
 *
 *   POST /api/v1/actions/schedule-job   — manual schedule arming (admin)
 *   POST /api/v1/actions/job-run-stats  — per-schedule execution buckets
 *                                        for the `sparkline` cells
 *
 * Same service layer as the NATS route — the HTTP controller is a pure
 * transport adapter (boundary rule).
 */

import {
  makeRpcRouter,
  Permission,
  logger,
  type RouteHandler,
  type RpcRouteContext,
} from "@primebrick/sdk";
import { field, Filter, GroupBy, Project, Sort } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { declareSchedule, disarmSchedule, ScheduleDeclarationError } from "../../services/schedule-service.js";

interface ScheduleJobBody {
  schedule_subject?: string;
  schedule?: string;
  target?: string;
  payload?: unknown;
  ttl?: string;
}

interface RunStatsBody {
  schedule_subjects?: string[];
  span_ms?: number;
}

type BucketUnit = "hour" | "day" | "week" | "month";

/** Choose the bucket unit so `span` lands in ~8–30 buckets. */
function pickBucketUnit(spanMs: number): { unit: BucketUnit; ms: number } {
  const HOUR = 3_600_000, DAY = 24 * HOUR;
  if (spanMs <= 24 * HOUR) return { unit: "hour", ms: HOUR };
  if (spanMs <= 30 * DAY) return { unit: "day", ms: DAY };
  if (spanMs <= 30 * 7 * DAY) return { unit: "week", ms: 7 * DAY };
  return { unit: "month", ms: 30 * DAY };
}

async function runStats(body: RunStatsBody): Promise<unknown> {
  const subjects = Array.isArray(body.schedule_subjects) ? body.schedule_subjects : [];
  if (subjects.length === 0) return { bucket_unit: "day", stats: {} };

  const spanMs = typeof body.span_ms === "number" && body.span_ms > 0
    ? body.span_ms
    : 30 * 24 * 3_600_000; // default 30d
  const { unit } = pickBucketUnit(spanMs);

  interface StatRow {
    schedule_subject: string;
    bucket_start: Date;
    succeeded: bigint;
    failed: bigint;
    skipped: bigint;
  }
  const rows = (await getDal().findAll<JobRunEntity, StatRow>(
    JobRunEntity,
    [
      Project.field(field(JobRunEntity, "schedule_subject")),
      Project.expr("date_trunc(?::text, created_at)", "bucket_start", [unit]),
      Project.expr("count(*) FILTER (WHERE status = 'succeeded')", "succeeded"),
      Project.expr("count(*) FILTER (WHERE status = 'failed')", "failed"),
      Project.expr("count(*) FILTER (WHERE status = 'skipped')", "skipped"),
    ],
    {
      filters: [
        Filter.expr(
          { sql: "schedule_subject" },
          "=",
          { sql: "ANY(?)", params: [subjects] },
        ),
        Filter.expr(
          { sql: "created_at" },
          ">=",
          { sql: "now() - make_interval(secs => ? / 1000.0)", params: [spanMs] },
        ),
      ],
      // Group on the select alias — a parameterized date_trunc in GROUP BY
      // binds a different `$n` than the projection's, so Postgres treats
      // them as distinct expressions ("must appear in GROUP BY clause").
      groupBy: [GroupBy.expr("bucket_start")],
      sorting: [Sort.byAlias("bucket_start")],
    },
  )) as StatRow[];

  const stats: Record<string, { bucket_start: string; succeeded: number; failed: number; skipped: number }[]> = {};
  for (const r of rows) {
    (stats[r.schedule_subject] ??= []).push({
      bucket_start: r.bucket_start.toISOString(),
      succeeded: Number(r.succeeded),
      failed: Number(r.failed),
      skipped: Number(r.skipped),
    });
  }
  return { bucket_unit: unit, stats };
}

export const jobActionsRouteHandler: RouteHandler = makeRpcRouter([
  {
    method: "POST",
    path: "/api/v1/actions/schedule-job",
    permissions: [Permission.AUTHENTICATED_ADMIN],
    body: (raw) => raw as ScheduleJobBody,
    handler: async (ctx: RpcRouteContext) => {
      const b = ctx.body as ScheduleJobBody;
      const result = await declareSchedule({
        schedule_subject: b.schedule_subject!,
        schedule: b.schedule!,
        target: b.target!,
        kind: "manual",
        // manual arms are INTERNAL — no caller_service: the admin actor is
        // audited, the schedule lives in the "job" namespace and may target
        // any service's due subject.
        payload: b.payload,
        ttl: b.ttl,
        initiator: `user:${ctx.user?.id ?? ctx.user?.email ?? "unknown"}`,
      }).catch((err: unknown) => {
        if (err instanceof ScheduleDeclarationError) {
          logger.warn(`schedule-job rejected: ${err.internal_code} ${err.message}`, { tags: ["jobs"] });
        }
        throw err;
      });
      return result;
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/disarm-job",
    permissions: [Permission.AUTHENTICATED_ADMIN],
    body: (raw) => raw as { schedule_subject?: string },
    handler: async (ctx) => {
      const b = ctx.body as { schedule_subject?: string };
      await disarmSchedule(b.schedule_subject!, `user:${ctx.user?.email ?? "unknown"}`);
      return { disarmed: true };
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/job-run-stats",
    permissions: [Permission.AUTHENTICATED_USER],
    body: (raw) => raw as RunStatsBody,
    handler: async (ctx) => runStats(ctx.body as RunStatsBody),
  },
]);

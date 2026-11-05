/**
 * actions-route — the non-entity endpoints the jobs admin page needs:
 *
 *   POST /api/v1/actions/stop-job          — STOP: purge the schedule
 *        instance now (temporary — the owner may re-arm it)
 *   POST /api/v1/actions/disable-schedule  — DISABLE: owner-level off
 *        (trigger → enabled=false; infra → sticky `disarmed` suppression)
 *   POST /api/v1/actions/enable-schedule   — ENABLE: owner-level re-arm
 *        (trigger → enabled=true + re-derive; infra → unsuppress + rearm ping)
 *   POST /api/v1/actions/pause-schedule    — PAUSE: suppress re-arm until resume
 *   POST /api/v1/actions/resume-schedule   — RESUME: clear pause + re-arm
 *   POST /api/v1/actions/disarm-all        — DISABLE ALL (bulk)
 *   POST /api/v1/actions/pause-all         — PAUSE ALL (bulk)
 *   POST /api/v1/actions/resume-all        — RESUME ALL (bulk)
 *   POST /api/v1/actions/job-run-stats     — per-schedule execution buckets
 *   POST /api/v1/actions/schedule-drift    — drift diagnostic (read-only)
 *
 * Row ops bind to `job_schedule` via `entity_op` — `makeServiceRoutes`
 * emits them into `meta.actions` with the declared endpoint; the FE row
 * dropdown dispatches writes on that contract (no page-side handlers).
 * Bulk ops ride `bulk_custom_actions` on the same entity.
 *
 * Same service layer as the NATS route — the HTTP controller is a pure
 * transport adapter (boundary rule).
 */

import {
  Permission,
  logger,
  ValidationError,
  type RpcRoute,
} from "@primebrick/sdk";
import { field, Filter, GroupBy, Project, Sort } from "@primebrick/dal-pg";
import { getDal } from "../../db/dal.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobTriggerEntity, TRIGGER_SCHEDULE_SUBJECT_PREFIX } from "../../domain/entities/job_trigger_entity.js";
import {
  disarmSchedule,
  dropScheduleMirror,
  getLastReconcileReport,
  getScheduleRow,
  requestOwnerRearm,
  scheduleDrift,
  unsuppressSchedule,
} from "../../services/schedule-service.js";
import { refreshTrigger } from "../../services/triggers-engine.js";
import { listJobScheduleSubjects } from "../../nats/schedule-mechanism.js";

interface RunStatsBody {
  schedule_subjects?: string[];
  /** Trigger-keyed variant — each uuid resolves to its schedule-mirror
   *  subject (`jobs.schedule.job.<uuid>`); stats come back keyed by the
   *  submitted uuid so a `row_key:"uuid"` sparkline column binds directly. */
  trigger_uuids?: string[];
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

export async function runStats(body: RunStatsBody): Promise<unknown> {
  const triggerUuids = Array.isArray(body.trigger_uuids) ? body.trigger_uuids : [];
  const subjects = [
    ...(Array.isArray(body.schedule_subjects) ? body.schedule_subjects : []),
    ...triggerUuids.map((u) => `${TRIGGER_SCHEDULE_SUBJECT_PREFIX}${u}`),
  ];
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
  // Trigger-keyed requests bind the sparkline by the row's `uuid`, not the
  // resolved mirror subject — remap those keys back before responding.
  for (const u of triggerUuids) {
    const subject = `${TRIGGER_SCHEDULE_SUBJECT_PREFIX}${u}`;
    if (stats[subject]) {
      stats[u] = stats[subject];
      delete stats[subject];
    }
  }
  return { bucket_unit: unit, stats };
}

type ScheduleSubjectBody = { schedule_subject: string };

function scheduleSubjectBody(raw: unknown): ScheduleSubjectBody {
  const b = raw as { schedule_subject?: string };
  if (typeof b?.schedule_subject !== "string" || !b.schedule_subject.startsWith("jobs.schedule.")) {
    throw new ValidationError("body.schedule_subject must be a jobs.schedule.* subject");
  }
  return b as ScheduleSubjectBody;
}

type TriggerUuidBody = { uuid: string };

function triggerUuidBody(raw: unknown): TriggerUuidBody {
  const b = raw as { uuid?: string };
  if (typeof b?.uuid !== "string" || !b.uuid) {
    throw new ValidationError("body.uuid is required");
  }
  return b as TriggerUuidBody;
}

function actorOf(ctx: { user?: { email?: string | null } | null }): string {
  return `user:${ctx.user?.email ?? "unknown"}`;
}

async function loadOwnerTrigger(triggerUuid: string): Promise<JobTriggerEntity | undefined> {
  const rows = await getDal().findAll<JobTriggerEntity>(JobTriggerEntity, null, {
    filters: [Filter.fieldValue(field(JobTriggerEntity, "uuid"), "=", triggerUuid)],
  });
  return Array.isArray(rows) ? rows[0] : undefined;
}

/** Flip the owning trigger's enabled flag + re-derive via the engine. */
async function setTriggerEnabled(triggerUuid: string, enabled: boolean, actor: string): Promise<void> {
  const trig = await loadOwnerTrigger(triggerUuid);
  if (!trig) throw new ValidationError(`owner trigger ${triggerUuid} not found`);
  await getDal().update(
    JobTriggerEntity,
    { uuid: trig.uuid, enabled, version: trig.version } as never,
    { actor, matchBy: "uuid" } as never,
  );
  await refreshTrigger(triggerUuid);
}

/**
 * Dead-owner detection — a `trigger`-kind mirror row whose owning trigger
 * is soft-deleted is garbage: nothing can ever re-arm it (the engine's
 * `dropScheduleMirror` on trigger delete already proves the model wants
 * no tombstone; this catches rows orphaned while JH was down). Drops the
 * mirror and returns true.
 */
async function dropIfDeadOwner(row: JobScheduleEntity | undefined, actor: string): Promise<boolean> {
  if (row?.kind !== "trigger" || !row.trigger_uuid) return false;
  if (await loadOwnerTrigger(row.trigger_uuid)) return false;
  await dropScheduleMirror(row.schedule_subject, actor);
  logger.done(`schedule mirror dropped — owner trigger deleted: ${row.schedule_subject}`, { tags: ["jobs"] });
  return true;
}

/**
 * DISABLE — owner-level off. Trigger schedules cascade to
 * `job_triggers.enabled=false` (the engine disarms); infra schedules get
 * the sticky `disarmed` suppression — owner re-declares are refused until
 * an explicit enable.
 */
async function disableSchedule(scheduleSubject: string, actor: string): Promise<{ disabled: true }> {
  const row = await getScheduleRow(scheduleSubject);
  if (await dropIfDeadOwner(row, actor)) return { disabled: true };
  if (row?.kind === "trigger" && row.trigger_uuid) {
    await setTriggerEnabled(row.trigger_uuid, false, actor);
    return { disabled: true };
  }
  await disarmSchedule(scheduleSubject, actor, "disarmed");
  return { disabled: true };
}

/**
 * ENABLE — owner-level re-arm. Trigger: enabled=true + re-derive.
 * Infra: clear the suppression (`stopped`) + rearm ping — the owner
 * re-declares with fresh payload/headers (JH cannot fabricate them).
 */
async function enableSchedule(scheduleSubject: string, actor: string): Promise<{ enabled: true; rearm_requested?: boolean }> {
  // Dead owner → the tombstone drops instead of pretending an enable:
  // there is nothing to re-arm, so the request fails honestly.
  if (await dropIfDeadOwner(await getScheduleRow(scheduleSubject), actor)) {
    throw new ValidationError("owner trigger deleted — schedule mirror dropped");
  }
  const row = await unsuppressSchedule(scheduleSubject, actor);
  if (row?.kind === "trigger" && row.trigger_uuid) {
    await setTriggerEnabled(row.trigger_uuid, true, actor);
  } else if (row) {
    await requestOwnerRearm(scheduleSubject, row.service_code);
    return { enabled: true, rearm_requested: true };
  }
  return { enabled: true };
}

/** RESUME — clear `paused` + re-arm (like enable, minus the trigger flip:
 *  pause never touched `enabled`). */
async function resumeSchedule(scheduleSubject: string, actor: string): Promise<{ resumed: true; rearm_requested?: boolean }> {
  if (await dropIfDeadOwner(await getScheduleRow(scheduleSubject), actor)) {
    throw new ValidationError("owner trigger deleted — schedule mirror dropped");
  }
  const row = await unsuppressSchedule(scheduleSubject, actor);
  if (row?.kind === "trigger" && row.trigger_uuid) {
    await refreshTrigger(row.trigger_uuid);
  } else if (row) {
    await requestOwnerRearm(scheduleSubject, row.service_code);
    return { resumed: true, rearm_requested: true };
  }
  return { resumed: true };
}

async function listSchedules(statuses: string[]): Promise<JobScheduleEntity[]> {
  const rows = await getDal().findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.expr({ sql: "status" }, "IN", { sql: `(SELECT unnest(?::text[]))`, params: [statuses] })],
  });
  return Array.isArray(rows) ? (rows as JobScheduleEntity[]) : [];
}

interface BulkReport {
  affected: string[];
  skipped: { subject: string; reason: string }[];
  errors: { subject: string; error: string }[];
}

export const jobActionsRoutes: RpcRoute[] = [
  {
    method: "POST",
    path: "/api/v1/actions/stop-job",
    entity_op: { entity: "job_schedule", op: "stop", cta: { icon: "square", row_key: "schedule_subject", translation_key: "job.jobs.actions.stop", visible_on: { field: "status", values: ["armed"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Stop a schedule instance (admin)",
      description:
        "Body: { schedule_subject } — purges the live declaration and marks the row `stopped`. " +
        "TEMPORARY: the owner/engine may re-arm it (trigger refresh, service re-declare). " +
        "For a permanent stop use disable-schedule.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => {
      const b = ctx.body as ScheduleSubjectBody;
      await disarmSchedule(b.schedule_subject, actorOf(ctx), "stopped");
      return { stopped: true };
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/disable-schedule",
    entity_op: { entity: "job_schedule", op: "disable", cta: { icon: "power", text_color: "text-red-600", row_key: "schedule_subject", translation_key: "job.jobs.actions.disable", visible_on: { field: "status", values: ["armed", "stopped", "paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Disable a schedule — owner-level off (admin)",
      description:
        "Trigger schedules cascade to `job_triggers.enabled=false`; infra schedules get the sticky " +
        "`disarmed` suppression (owner re-declares refused until explicit enable).",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => disableSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  {
    method: "POST",
    path: "/api/v1/actions/enable-schedule",
    entity_op: { entity: "job_schedule", op: "enable", cta: { icon: "power", text_color: "text-emerald-600", row_key: "schedule_subject", translation_key: "job.jobs.actions.enable", visible_on: { field: "status", values: ["disarmed", "stopped", "paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Enable a schedule — owner-level re-arm (admin)",
      description:
        "Trigger: `enabled=true` + engine re-derive. Infra: clears the `disarmed`/`paused` hold and " +
        "publishes `jobs.ctl.schedule.rearm.<svc>` — the owner re-declares with fresh payload/headers.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => enableSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  {
    method: "POST",
    path: "/api/v1/actions/pause-schedule",
    entity_op: { entity: "job_schedule", op: "pause", cta: { icon: "pause", row_key: "schedule_subject", translation_key: "job.jobs.actions.pause", visible_on: { field: "status", values: ["armed"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Pause a schedule — suppressed until resume (admin)",
      description:
        "`enabled` stays true but every re-arm path (refresh, event-match, ctl re-declare, due-lane) " +
        "is suppressed while `paused`. Survives restarts.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => {
      await disarmSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx), "paused");
      return { paused: true };
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/resume-schedule",
    entity_op: { entity: "job_schedule", op: "resume", cta: { icon: "play", row_key: "schedule_subject", translation_key: "job.jobs.actions.resume", visible_on: { field: "status", values: ["paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Resume a paused schedule (admin)",
      description: "Clears `paused` and re-arms (trigger: re-derive; infra: rearm ping to the owner).",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => resumeSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  {
    method: "POST",
    path: "/api/v1/actions/enable-trigger",
    entity_op: { entity: "job_trigger", op: "enable", cta: { icon: "power", text_color: "text-emerald-600", translation_key: "job.jobs.actions.enable", visible_on: { field: "enabled", values: [false] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Enable a trigger — arm it (admin)",
      description:
        "Body: { uuid } — sets `enabled=true` and re-derives the trigger's schedule through the engine.",
      tags: ["jobs", "actions"],
    },
    body: triggerUuidBody,
    handler: async (ctx) => {
      await setTriggerEnabled((ctx.body as TriggerUuidBody).uuid, true, actorOf(ctx));
      return { enabled: true };
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/disable-trigger",
    entity_op: { entity: "job_trigger", op: "disable", cta: { icon: "power", text_color: "text-red-600", translation_key: "job.jobs.actions.disable", visible_on: { field: "enabled", values: [true] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Disable a trigger — disarm it (admin)",
      description:
        "Body: { uuid } — sets `enabled=false`; the engine drops the trigger's schedule declaration.",
      tags: ["jobs", "actions"],
    },
    body: triggerUuidBody,
    handler: async (ctx) => {
      await setTriggerEnabled((ctx.body as TriggerUuidBody).uuid, false, actorOf(ctx));
      return { disabled: true };
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/disarm-all",
    entity_op: { entity: "job_schedule", op: "disarm_all", cta: { icon: "power", text_color: "text-red-600", translation_key: "job.jobs.actions.disarm_all", confirm_key: "job.jobs.actions.disarm_all_confirm" } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Disable every armed schedule (admin, bulk)",
      description:
        "Trigger schedules → `enabled=false` + re-derive; infra schedules → sticky `disarmed`. " +
        "Already-suppressed rows are reported as skipped.",
      tags: ["jobs", "actions"],
    },
    body: (raw) => raw as Record<string, never>,
    handler: async (ctx) => {
      const report: BulkReport = { affected: [], skipped: [], errors: [] };
      // armed + stopped both carry owner intent — DISABLE ALL switches the
      // owner off permanently, so `stopped` rows disable too (not skipped).
      for (const row of await listSchedules(["armed", "stopped"])) {
        try {
          await disableSchedule(row.schedule_subject, actorOf(ctx));
          report.affected.push(row.schedule_subject);
        } catch (err) {
          report.errors.push({ subject: row.schedule_subject, error: String(err) });
        }
      }
      return report;
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/pause-all",
    entity_op: { entity: "job_schedule", op: "pause_all", cta: { icon: "pause", translation_key: "job.jobs.actions.pause_all", confirm_key: "job.jobs.actions.pause_all_confirm" } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Pause every armed schedule (admin, bulk)",
      description: "Freeze the world: every armed row → `paused` (re-arm suppressed until resume-all/resume).",
      tags: ["jobs", "actions"],
    },
    body: (raw) => raw as Record<string, never>,
    handler: async (ctx) => {
      const report: BulkReport = { affected: [], skipped: [], errors: [] };
      for (const row of await listSchedules(["armed"])) {
        try {
          await disarmSchedule(row.schedule_subject, actorOf(ctx), "paused");
          report.affected.push(row.schedule_subject);
        } catch (err) {
          report.errors.push({ subject: row.schedule_subject, error: String(err) });
        }
      }
      return report;
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/resume-all",
    entity_op: { entity: "job_schedule", op: "resume_all", cta: { icon: "play", translation_key: "job.jobs.actions.resume_all", confirm_key: "job.jobs.actions.resume_all_confirm" } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Resume every paused schedule (admin, bulk)",
      description: "Thaw: every `paused` row → `stopped` + re-arm (trigger re-derive / infra rearm ping).",
      tags: ["jobs", "actions"],
    },
    body: (raw) => raw as Record<string, never>,
    handler: async (ctx) => {
      const report: BulkReport = { affected: [], skipped: [], errors: [] };
      for (const row of await listSchedules(["paused"])) {
        try {
          await resumeSchedule(row.schedule_subject, actorOf(ctx));
          report.affected.push(row.schedule_subject);
        } catch (err) {
          report.errors.push({ subject: row.schedule_subject, error: String(err) });
        }
      }
      return report;
    },
  },
  {
    method: "POST",
    path: "/api/v1/actions/job-run-stats",
    permissions: [Permission.AUTHENTICATED_USER],
    openapi: {
      summary: "Per-schedule execution buckets",
      description: "Bucketed run statistics for the sparkline cells of the jobs admin page.",
      tags: ["jobs", "actions"],
    },
    body: (raw) => raw as RunStatsBody,
    handler: async (ctx) => runStats(ctx.body as RunStatsBody),
  },
  {
    method: "POST",
    path: "/api/v1/actions/schedule-drift",
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Schedule drift diagnostic (admin)",
      description:
        "Read-only: last boot reconcile report + live declaration enumeration " +
        "and the rows currently drifting (mirror vs NATS). Never mutates.",
      tags: ["jobs", "actions"],
    },
    handler: async () => {
      const rows = (await getDal().findAll<JobScheduleEntity>(JobScheduleEntity, null, {})) as JobScheduleEntity[];
      const liveSubjects = await listJobScheduleSubjects().catch(() => undefined);
      const drifted = rows
        .map((r) => {
          const d = scheduleDrift(r, liveSubjects === undefined ? undefined : liveSubjects.includes(r.schedule_subject));
          return { schedule_subject: r.schedule_subject, status: r.status, kind: r.kind, live: d.live, drift: d.drift };
        })
        .filter((r) => r.drift !== null || r.live === false);
      return {
        enumeration_ok: liveSubjects !== undefined,
        reconcile_report: getLastReconcileReport(),
        drifted,
      };
    },
  },
];

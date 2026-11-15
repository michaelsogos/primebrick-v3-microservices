/**
 * actions-route — the non-entity endpoints the jobs admin page needs:
 *
 *   POST /api/v1/actions/stop-job          — STOP: purge the schedule
 *        instance now (temporary — the owner may re-arm it)
 *   POST /api/v1/actions/disable-schedule  — DISABLE: owner-level off
 *        (the owning trigger soft-deletes; the engine disarms)
 *   POST /api/v1/actions/enable-schedule   — ENABLE: owner-level re-arm
 *        (unsuppress + restore + re-derive the owning trigger)
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
  scheduleDrift,
  ttlToMs,
  unsuppressSchedule,
} from "../../services/schedule-service.js";
import { JobSchedulesService } from "../../modules/jobs/jobs.service.js";
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

const BUCKET_STEP_MS: Record<Exclude<BucketUnit, "month">, number> = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
};

/** Choose the bucket unit so `span` lands in ~8–30 buckets. */
function pickBucketUnit(spanMs: number): { unit: BucketUnit; ms: number } {
  const HOUR = 3_600_000, DAY = 24 * HOUR;
  if (spanMs <= 24 * HOUR) return { unit: "hour", ms: HOUR };
  if (spanMs <= 30 * DAY) return { unit: "day", ms: DAY };
  if (spanMs <= 30 * 7 * DAY) return { unit: "week", ms: 7 * DAY };
  return { unit: "month", ms: 30 * DAY };
}

/**
 * UTC `date_trunc` twin — the DB runs Etc/UTC, so JS truncation on the
 * same boundaries merges 1:1 with the sparse bucket_start keys. `week`
 * aligns to ISO Monday (Postgres `date_trunc('week')` semantic); `month`
 * is a calendar month, stepped via setUTCMonth (not a fixed ms span).
 */
function truncBucket(d: Date, unit: BucketUnit): Date {
  const t = new Date(d);
  if (unit === "hour") {
    t.setUTCMinutes(0, 0, 0);
  } else if (unit === "day") {
    t.setUTCHours(0, 0, 0, 0);
  } else if (unit === "week") {
    t.setUTCHours(0, 0, 0, 0);
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  } else {
    t.setUTCHours(0, 0, 0, 0);
    t.setUTCDate(1);
  }
  return t;
}

function nextBucket(d: Date, unit: BucketUnit): void {
  if (unit === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setTime(d.getTime() + BUCKET_STEP_MS[unit]);
}

/**
 * Expected fires of one schedule inside ONE bucket — closed form, no
 * iteration. `@every` fires at `armed_at + k·interval` (k≥1): the count
 * is the k-range intersecting [bucket_start, bucket_end) ∩ (armed_at,
 * window_end]. `@at` contributes 1 when its instant sits inside both.
 * The window ends at the latest disarm (`disarmed_at` — stamped by every
 * disarm flavor), the TTL `expires_at`, or `now`. Re-arms overwrite
 * `armed_at`: expected counts the CURRENT arm window only — dues owed
 * before the latest arm are not recoverable (documented limit).
 * Cron/invalid specs are not derivable (NATS is the sole cron
 * interpreter) → null.
 */
function expectedInBucket(
  sched: { schedule_spec: string; armed_at?: Date; disarmed_at?: Date; expires_at?: Date },
  b0: number,
  b1: number,
  now: number,
): number | null {
  if (!sched.armed_at) return null;
  const armed = sched.armed_at.getTime();
  const end = Math.min(
    sched.disarmed_at?.getTime() ?? Number.POSITIVE_INFINITY,
    sched.expires_at?.getTime() ?? Number.POSITIVE_INFINITY,
    now,
  );
  const spec = sched.schedule_spec.trim();
  if (spec.startsWith("@every")) {
    const interval = ttlToMs(spec.slice(6).trim());
    if (interval === undefined || interval <= 0) return null;
    const kMin = Math.max(1, Math.ceil((b0 - armed) / interval));
    const kMax = Math.min(
      Math.ceil((b1 - armed) / interval) - 1,
      Math.floor((end - armed) / interval),
    );
    return Math.max(0, kMax - kMin + 1);
  }
  if (spec.startsWith("@at")) {
    const at = new Date(spec.slice(3).trim()).getTime();
    if (Number.isNaN(at)) return null;
    return at >= b0 && at < b1 && at >= armed && at <= end ? 1 : 0;
  }
  return null; // cron — NATS owns evaluation; not derivable here
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
    lost: bigint;
    dispatched: bigint;
  }
  const rows = (await getDal().findAll<JobRunEntity, StatRow>(
    JobRunEntity,
    [
      Project.field(field(JobRunEntity, "schedule_subject")),
      Project.expr("date_trunc(?::text, created_at)", "bucket_start", [unit]),
      Project.expr("count(*) FILTER (WHERE status = 'succeeded')", "succeeded"),
      Project.expr("count(*) FILTER (WHERE status = 'failed')", "failed"),
      Project.expr("count(*) FILTER (WHERE status = 'skipped')", "skipped"),
      Project.expr("count(*) FILTER (WHERE status = 'lost')", "lost"),
      Project.expr("count(*) FILTER (WHERE status = 'dispatched')", "dispatched"),
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

  // The mirror rows carry the spec + arm window the expected-fires
  // enumeration needs (run buckets alone cannot say what was owed).
  const schedBySubject = new Map((await new JobSchedulesService().listRowsBySubjects(subjects)).map((r) => [r.schedule_subject, r]));

  // Zero-fill: the FE renders slots by position, so a sparse array would
  // lie about *when* runs happened — every bucket in the span is emitted,
  // empty ones carry zero counts (the "never ran" story is the frame).
  const zeroBucket = { succeeded: 0, failed: 0, skipped: 0, lost: 0, dispatched: 0 };
  const sparse = new Map<string, Map<string, typeof zeroBucket>>();
  for (const r of rows) {
    let m = sparse.get(r.schedule_subject);
    if (!m) sparse.set(r.schedule_subject, (m = new Map()));
    m.set(r.bucket_start.toISOString(), {
      succeeded: Number(r.succeeded),
      failed: Number(r.failed),
      skipped: Number(r.skipped),
      lost: Number(r.lost),
      dispatched: Number(r.dispatched),
    });
  }

  const now = new Date();
  const grid: string[] = [];
  for (const c = truncBucket(new Date(now.getTime() - spanMs), unit); c.getTime() <= now.getTime(); nextBucket(c, unit)) {
    grid.push(c.toISOString());
  }

  const stats: Record<string, ({ bucket_start: string; expected: number | null; missed: number | null } & typeof zeroBucket)[]> = {};
  for (const subject of subjects) {
    const m = sparse.get(subject);
    const sched = schedBySubject.get(subject);
    stats[subject] = grid.map((bucket_start) => {
      const counts = m?.get(bucket_start) ?? zeroBucket;
      const b0 = new Date(bucket_start).getTime();
      const b1 = new Date(bucket_start);
      nextBucket(b1, unit);
      const expected = sched ? expectedInBucket(sched, b0, b1.getTime(), now.getTime()) : null;
      // Missed = owed minus ARRIVED — every status counts as an arrival
      // (skipped means the due reached the lane and was suppressed; the
      // fire itself was not missed).
      const arrived = counts.succeeded + counts.failed + counts.skipped + counts.lost + counts.dispatched;
      const missed = expected === null ? null : Math.max(0, expected - arrived);
      return { bucket_start, ...counts, expected, missed };
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

/** Audit actor — the DAL convention is `user_profiles.uuid` or `"system"`.
 *  `ctx.user.id` IS the internal uuid (see sdk auth/types). Never fabricate
 *  `user:<email>` actors: the `<key>_name` join only resolves uuids. */
function actorOf(ctx: { user?: { id?: string | null } | null }): string {
  return ctx.user?.id ?? "system";
}

async function loadOwnerTrigger(triggerUuid: string, includeDeleted = false): Promise<JobTriggerEntity | undefined> {
  const rows = (await getDal().findAll<JobTriggerEntity>(JobTriggerEntity, null, {
    filters: [Filter.fieldValue(field(JobTriggerEntity, "uuid"), "=", triggerUuid)],
    ...(includeDeleted ? { deletedRecords: "INCLUDED" as const } : {}),
  })) as JobTriggerEntity[];
  return Array.isArray(rows) ? rows[0] : undefined;
}

/** Flip the owning trigger's soft-delete state + re-derive via the engine.
 *  DISABLE IS SOFT-DELETE: `deleted_at` replaces the dropped `enabled`
 *  column (doctrine — enable flags are a design error). delete/restore go
 *  through the repo so `deleted_by`/audit hooks stay canonical. */
async function setTriggerDeleted(triggerUuid: string, deleted: boolean, actor: string): Promise<void> {
  const trig = await loadOwnerTrigger(triggerUuid, deleted);
  if (!trig) throw new ValidationError(`owner trigger ${triggerUuid} not found`);
  const dal = getDal() as unknown as {
    delete(e: unknown, m: unknown, o: unknown): Promise<unknown>;
    restore(e: unknown, m: unknown, o: unknown): Promise<unknown>;
  };
  await (deleted
    ? dal.delete(JobTriggerEntity, { uuid: trig.uuid, version: trig.version }, { actor, matchBy: "uuid" })
    : dal.restore(JobTriggerEntity, { uuid: trig.uuid, version: trig.version }, { actor, matchBy: "uuid" }));
  await refreshTrigger(triggerUuid);
}

/**
 * Dead-owner detection — every mirror is trigger-owned (`trigger_uuid`
 * NOT NULL): a row whose owning trigger is soft-deleted is garbage —
 * nothing can ever re-arm it (the engine's `dropScheduleMirror` on
 * trigger delete already proves the model wants no tombstone; this
 * catches rows orphaned while JH was down). Drops the mirror and
 * returns true.
 */
async function dropIfDeadOwner(row: JobScheduleEntity | undefined, actor: string): Promise<boolean> {
  if (!row?.trigger_uuid) return false;
  if (await loadOwnerTrigger(row.trigger_uuid)) return false;
  await dropScheduleMirror(row.schedule_subject, actor);
  logger.done(`schedule mirror dropped — owner trigger deleted: ${row.schedule_subject}`, { tags: ["jobs"] });
  return true;
}

/**
 * DISABLE — owner-level off: cascade to `job_triggers` soft-delete
 * (deleted_at); the engine disarms on the changed broadcast.
 */
async function disableSchedule(scheduleSubject: string, actor: string): Promise<{ disabled: true }> {
  const row = await getScheduleRow(scheduleSubject);
  if (await dropIfDeadOwner(row, actor)) return { disabled: true };
  if (row?.trigger_uuid) {
    await setTriggerDeleted(row.trigger_uuid, true, actor);
    return { disabled: true };
  }
  await disarmSchedule(scheduleSubject, actor, "disarmed");
  return { disabled: true };
}

/**
 * ENABLE — owner-level re-arm: clear the suppression (`stopped`), then
 * restore + re-derive the owning trigger.
 */
async function enableSchedule(scheduleSubject: string, actor: string): Promise<{ enabled: true }> {
  // Dead owner → the tombstone drops instead of pretending an enable:
  // there is nothing to re-arm, so the request fails honestly.
  if (await dropIfDeadOwner(await getScheduleRow(scheduleSubject), actor)) {
    throw new ValidationError("owner trigger deleted — schedule mirror dropped");
  }
  const row = await unsuppressSchedule(scheduleSubject, actor);
  if (row?.trigger_uuid) {
    await setTriggerDeleted(row.trigger_uuid, false, actor);
  }
  return { enabled: true };
}

/** RESUME — clear `paused` + re-arm (like enable, minus the trigger flip:
 *  pause never soft-deletes the trigger). */
async function resumeSchedule(scheduleSubject: string, actor: string): Promise<{ resumed: true }> {
  if (await dropIfDeadOwner(await getScheduleRow(scheduleSubject), actor)) {
    throw new ValidationError("owner trigger deleted — schedule mirror dropped");
  }
  const row = await unsuppressSchedule(scheduleSubject, actor);
  if (row?.trigger_uuid) {
    await refreshTrigger(row.trigger_uuid);
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
    entity_op: { entity: "job_schedule", op: "disable", cta: { icon: "power", color: "destructive", row_key: "schedule_subject", translation_key: "job.jobs.actions.disable", visible_on: { field: "status", values: ["armed", "stopped", "paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Disable a schedule — owner-level off (admin)",
      description:
        "Cascades to `job_triggers` soft-delete (deleted_at) — the owning trigger " +
        "disarms on the engine's changed broadcast; only an explicit enable restores.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => disableSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  {
    method: "POST",
    path: "/api/v1/actions/enable-schedule",
    entity_op: { entity: "job_schedule", op: "enable", cta: { icon: "power", color: "success", row_key: "schedule_subject", translation_key: "job.jobs.actions.enable", visible_on: { field: "status", values: ["disarmed", "stopped", "paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Enable a schedule — owner-level re-arm (admin)",
      description:
        "Clears the `disarmed`/`paused` hold, then restores the owning trigger and " +
        "lets the engine re-derive its schedule.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => enableSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  {
    method: "POST",
    path: "/api/v1/actions/pause-schedule",
    entity_op: { entity: "job_schedule", op: "pause", cta: { icon: "pause:filled", row_key: "schedule_subject", translation_key: "job.jobs.actions.pause", visible_on: { field: "status", values: ["armed"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Pause a schedule — suppressed until resume (admin)",
      description:
        "not soft-deleted, and every re-arm path (refresh, event-match, ctl re-declare, due-lane) " +
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
    entity_op: { entity: "job_schedule", op: "resume", cta: { icon: "play:filled", row_key: "schedule_subject", translation_key: "job.jobs.actions.resume", visible_on: { field: "status", values: ["paused"] } } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Resume a paused schedule (admin)",
      description: "Clears `paused` and re-derives the owning trigger's schedule.",
      tags: ["jobs", "actions"],
    },
    body: scheduleSubjectBody,
    handler: async (ctx) => resumeSchedule((ctx.body as ScheduleSubjectBody).schedule_subject, actorOf(ctx)),
  },
  // NOTE: no enable/disable-trigger routes — doctrine: DISABLE IS
  // SOFT-DELETE. Standard `delete.single`/`restore.single` do the work;
  // `afterWrite` publishes `jobs.ctl.triggers.changed` and the engine
  // re-derives arms/disarms automatically. Chrome (Disattiva/Attiva
  // labels + square/play icons) lives in `meta.actions_overrides`.
  {
    method: "POST",
    path: "/api/v1/actions/disarm-all",
    entity_op: { entity: "job_schedule", op: "disarm_all", cta: { icon: "power", color: "destructive", translation_key: "job.jobs.actions.disarm_all", confirm_key: "job.jobs.actions.disarm_all_confirm" } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Disable every armed schedule (admin, bulk)",
      description:
        "Every armed/stopped mirror's owning trigger soft-deletes; the engine " +
        "disarms each. Already-suppressed rows are reported as skipped.",
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
    entity_op: { entity: "job_schedule", op: "pause_all", cta: { icon: "pause:filled", translation_key: "job.jobs.actions.pause_all", confirm_key: "job.jobs.actions.pause_all_confirm" } },
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
    entity_op: { entity: "job_schedule", op: "resume_all", cta: { icon: "play:filled", translation_key: "job.jobs.actions.resume_all", confirm_key: "job.jobs.actions.resume_all_confirm" } },
    permissions: [Permission.AUTHENTICATED_ADMIN],
    openapi: {
      summary: "Resume every paused schedule (admin, bulk)",
      description: "Thaw: every `paused` row → `stopped` + re-derive the owning trigger.",
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
          return { schedule_subject: r.schedule_subject, status: r.status, live: d.live, drift: d.drift };
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

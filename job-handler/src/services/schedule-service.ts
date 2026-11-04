/**
 * schedule-service — the ONLY writer of `jobs.schedule.*` declarations.
 *
 * Every arm/disarm flows through here: the `jobs.ctl.schedule.request`
 * route (services self-declaring infra jobs), the rules engine (rule-
 * materialized schedules), and the admin HTTP action (manual jobs).
 *
 * Invariants enforced:
 *   - schedule_subject is `jobs.schedule.<owner>.<name>[.<id>]`
 *   - target is `jobs.due.<lane>.<owner>.<action>[.<id>]` — the lane is
 *     derived from the target prefix, never trusted from input
 *   - for route-declared schedules, <owner> MUST equal the caller's
 *     service code (parsed from its UA) — a service can only arm its own
 *     namespace; rule/manual schedules are declared by primebrick-job
 *     itself (owner "job" or the target service for rule lanes)
 *   - every arm/disarm is mirrored in job.job_schedules (observability)
 */

import {
  ensureJobSchedule,
  cancelJobSchedule,
  getJobSchedule,
  listJobScheduleSubjects,
  logger,
} from "@primebrick/sdk";
import { Filter, field, toUUID } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import { JobScheduleEntity } from "../domain/entities/job_schedule_entity.js";

export interface DeclareScheduleInput {
  schedule_subject: string;
  schedule: string;
  target: string;
  kind: "infra_derived" | "trigger";
  /** Caller's verified service code — undefined for internal (rules engine). */
  caller_service?: string;
  payload?: unknown;
  source?: string;
  ttl?: string;
  forwardHeaders?: Record<string, string>;
  initiator?: string;
  trigger_uuid?: string;
  /**
   * What job_schedules.target_subject shows when the real destination
   * differs from the NATS fire target — rules arm on the JH-internal
   * `jobs.due.<lane>.job.forward.*` trampoline but the row mirrors the
   * callable subject users configured (e.g. `emailsender.send`).
   */
  mirror_target?: string;
}

const SUBJECT_RE = /^jobs\.schedule\.([a-z0-9-]+)\.([a-z0-9-]+)(\..+)?$/;
const TARGET_RE = /^jobs\.due\.(user|system)\.([a-z0-9-]+)\.([a-z0-9.-]+)$/;

export class ScheduleDeclarationError extends Error {
  constructor(
    public readonly internal_code: string,
    message: string,
  ) {
    super(message);
    this.name = "ScheduleDeclarationError";
  }
}

/** Parse the caller's service code out of its verified UA (`primebrick-<svc>/x.y`). */
export function callerServiceCode(userAgent: string | undefined): string {
  const m = /^primebrick-([a-z0-9-]+)\//.exec(userAgent ?? "");
  if (!m) throw new ScheduleDeclarationError("UNIDENTIFIED_CALLER", "missing/invalid User-Agent identity");
  return m[1]!;
}

export async function declareSchedule(input: DeclareScheduleInput): Promise<{ seq: bigint }> {
  const sm = SUBJECT_RE.exec(input.schedule_subject);
  if (!sm) {
    throw new ScheduleDeclarationError(
      "INVALID_SCHEDULE_SUBJECT",
      `schedule_subject must be jobs.schedule.<owner>.<name>[.<id>], got "${input.schedule_subject}"`,
    );
  }
  const owner = sm[1]!;
  const tm = TARGET_RE.exec(input.target);
  if (!tm) {
    throw new ScheduleDeclarationError(
      "INVALID_TARGET_SUBJECT",
      `target must be jobs.due.user|system.<owner>.<action>[.<id>], got "${input.target}"`,
    );
  }
  const lane = tm[1]! as "user" | "system";
  const targetOwner = tm[2]!;
  if (input.caller_service) {
    // Remote caller (a service self-declaring via jobs.ctl.schedule.request):
    // it may only declare inside its own namespace AND the fired message
    // must land back on its own service — a service arms schedules that
    // execute on itself, never on another service.
    if (input.caller_service !== owner) {
      throw new ScheduleDeclarationError(
        "FOREIGN_NAMESPACE",
        `service "${input.caller_service}" cannot declare schedules in "${owner}" namespace`,
      );
    }
    if (targetOwner !== owner) {
      throw new ScheduleDeclarationError(
        "NAMESPACE_MISMATCH",
        `target "${input.target}" executes in service "${targetOwner}" but the schedule is declared in "${owner}" namespace`,
      );
    }
  }
  // Internal callers (rules engine, admin action) own the "job" namespace
  // and MAY target any service's due subject — that's the point of rules.

  const seq = await ensureJobSchedule({
    scheduleSubject: input.schedule_subject,
    schedule: input.schedule,
    target: input.target,
    payload: input.payload,
    source: input.source,
    ttl: input.ttl,
    forwardHeaders: input.forwardHeaders,
  });

  // Mirror in job_schedules — upsert on the unique schedule_subject.
  const dal = getDal();
  const existing = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", input.schedule_subject)],
  });
  const row: Partial<JobScheduleEntity> = {
    schedule_subject: input.schedule_subject,
    service_code: owner,
    job_name: sm[2]!,
    kind: input.kind,
    lane,
    schedule_spec: input.schedule,
    schedule_type: input.schedule.startsWith("@at") ? "once" : "recurring",
    target_subject: input.mirror_target ?? input.target,
    status: "armed",
    initiator: input.initiator ?? input.caller_service ?? "job",
    trigger_uuid: input.trigger_uuid === undefined ? undefined : toUUID(input.trigger_uuid),
    armed_at: new Date(),
    disarmed_at: undefined,
  };
  const actor = input.caller_service ?? input.initiator ?? "system:primebrick-job";
  if (Array.isArray(existing) && existing.length > 0) {
    await dal.update(
      JobScheduleEntity,
      { ...row, uuid: existing[0]!.uuid, version: existing[0]!.version } as never,
      { actor, matchBy: "uuid" } as never,
    );
  } else {
    await dal.add(JobScheduleEntity, row as never, { actor } as never);
  }

  logger.done(
    `schedule armed: ${input.schedule_subject} → ${input.target} (${input.schedule})`,
    { tags: ["jobs"] },
  );
  return { seq };
}

/** Disarm — JetStream cancel + registry status flip. */
export async function disarmSchedule(
  scheduleSubject: string,
  actor: string,
): Promise<void> {
  if (!SUBJECT_RE.test(scheduleSubject)) {
    throw new ScheduleDeclarationError(
      "INVALID_SCHEDULE_SUBJECT",
      `schedule_subject must be jobs.schedule.<owner>.<name>[.<id>], got "${scheduleSubject}"`,
    );
  }
  const rest = scheduleSubject.replace(/^jobs\.schedule\./, "");
  await cancelJobSchedule(scheduleSubject, `jobs.cancel.${rest}`);

  const dal = getDal();
  const rows = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject)],
  });
  if (Array.isArray(rows) && rows.length > 0) {
    await dal.update(
      JobScheduleEntity,
      {
        uuid: rows[0]!.uuid,
        status: "disarmed",
        disarmed_at: new Date(),
        version: rows[0]!.version,
      } as never,
      { actor, matchBy: "uuid" } as never,
    );
  }
  logger.done(`schedule disarmed: ${scheduleSubject}`, { tags: ["jobs"] });
}

/**
 * Reconcile the `job_schedules` registry mirror against the live JetStream
 * schedule declarations. Runs once at boot, AFTER `startTriggersEngine`
 * (the engine re-arms schedule-only triggers — reconciling first would
 * flag them as missing while it is still arming them).
 *
 * The DB rows are a MIRROR, not the truth — a direct SQL write flips the
 * mirror without touching NATS. This pass makes the mismatch self-healing:
 *
 *   row disarmed + declaration live  → PURGE the declaration (the direct-
 *     SQL-bypass drift: mirror says off, scheduler still fires). The row
 *     is already `disarmed` — no flip needed.
 *   row armed + declaration missing  → REPORT only. The declaration's
 *     payload/forwarded auth headers live inside the NATS message, not in
 *     the row — re-arming would fabricate an empty schedule. Trigger-kind
 *     rows are already re-armed by the engine; infra/manual rows heal
 *     when the owning service re-declares.
 *   declaration live + no row        → REPORT only (orphan). Purging is
 *     deliberately NOT automatic: a service that declared directly while
 *     JH was unreachable produces a legitimate orphan — surface it, let
 *     an operator decide. Strict orphan purging requires every producer
 *     to go through the governed route first.
 *
 * Every per-subject failure is collected — reconcile never aborts the
 * boot and never claims success it didn't achieve.
 */
export interface ReconcileReport {
  /** disarmed row + live declaration → declaration was purged. */
  purged_stale: string[];
  /** live declaration with no registry row → surfaced, NOT purged. */
  orphan_live: string[];
  /** armed row with no live declaration → surfaced (engine/owner re-arms). */
  armed_missing: string[];
  errors: { subject: string; error: string }[];
}

let lastReconcileReport: ReconcileReport | null = null;

/** The most recent boot reconcile outcome — for drift surfacing/health. */
export function getLastReconcileReport(): ReconcileReport | null {
  return lastReconcileReport;
}

export async function reconcileSchedules(): Promise<ReconcileReport> {
  const report: ReconcileReport = { purged_stale: [], orphan_live: [], armed_missing: [], errors: [] };
  const dal = getDal();
  const rows = (await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {})) as JobScheduleEntity[];
  const knownSubjects = new Set<string>();

  // Direction 1: registry → NATS (authoritative per-row direct-get).
  for (const row of rows) {
    const subject = row.schedule_subject;
    knownSubjects.add(subject);
    let live = false;
    try {
      live = (await getJobSchedule(subject)) !== null;
    } catch (error) {
      report.errors.push({ subject, error: `lookup failed: ${String(error)}` });
      continue;
    }
    if (row.status === "disarmed" && live) {
      try {
        const rest = subject.replace(/^jobs\.schedule\./, "");
        await cancelJobSchedule(subject, `jobs.cancel.${rest}`);
        report.purged_stale.push(subject);
        logger.warn(`reconcile: purged stale declaration ${subject} (row already disarmed)`, { tags: ["jobs"] });
      } catch (error) {
        report.errors.push({ subject, error: `purge failed: ${String(error)}` });
      }
    } else if (row.status === "armed" && !live) {
      report.armed_missing.push(subject);
      logger.warn(
        `reconcile: row armed but declaration missing: ${subject} (kind=${row.kind}) — owner/engine must re-declare`,
        { tags: ["jobs"] },
      );
    }
  }

  // Direction 2: NATS → registry (orphans). Enumeration failure degrades
  // this direction only — the registry checks above already ran.
  let liveSubjects: string[] = [];
  try {
    liveSubjects = await listJobScheduleSubjects();
  } catch (error) {
    report.errors.push({ subject: "jobs.schedule.>", error: `enumeration failed: ${String(error)}` });
  }
  for (const subject of liveSubjects) {
    if (knownSubjects.has(subject)) continue;
    report.orphan_live.push(subject);
    logger.warn(`reconcile: orphan declaration ${subject} has no registry row — surfaced, not purged`, { tags: ["jobs"] });
  }

  lastReconcileReport = report;
  logger.done(
    `schedule reconcile: ${report.purged_stale.length} purged, ${report.orphan_live.length} orphan, ` +
      `${report.armed_missing.length} armed-missing, ${report.errors.length} errors`,
    { tags: ["jobs"] },
  );
  return report;
}

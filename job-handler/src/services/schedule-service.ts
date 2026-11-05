/**
 * schedule-service — the ONLY writer of `jobs.schedule.*` declarations.
 *
 * Every arm/disarm flows through here: the `jobs.ctl.schedule.request`
 * route (services self-declaring infra jobs via the SDK's
 * `armJobSchedule`), the triggers engine, and the admin HTTP action.
 * The raw mechanism lives in `../nats/schedule-mechanism.ts` — job-handler
 * internal, unreachable from other services.
 *
 * ATOMIC PROTOCOL (NATS ↔ PG can never share a transaction — this is the
 * strongest ordering two stores allow, and it is enforced here, the ONLY
 * writer, so no caller can skip it):
 *
 *   ARM:    ensure → PubAck → read-back verify the declaration stored
 *           WITH its `Nats-Schedule`/`Nats-Schedule-Target` headers (a
 *           stored-but-unscheduled message — e.g. scheduler disabled —
 *           would pass PubAck yet never fire) → mirror upsert.
 *           Mirror failure COMPENSATES by purging the declaration —
 *           never a live schedule without a row.
 *   DISARM: cancel → PubAck → read-back verify the declaration is GONE
 *           (purge is applied at PubAck — verified empirically) → mirror
 *           flips `disarmed`. A mirror failure throws: the row stays
 *           `armed`, the declaration is gone — the drift surfaces
 *           honestly and a retry heals (disarm is idempotent).
 *
 * Every declaration is stamped `x-job-schedule-subject` so the fired
 * message self-correlates — the SDK transport middleware reports the
 * execution outcome to `jobs.result.*` for free on every consumer.
 *
 * Per-subject single-flight: arm/disarm for the SAME subject serialize —
 * a racing pair can never interleave (TOCTOU-free).
 *
 * Invariants enforced:
 *   - schedule_subject is `jobs.schedule.<owner>.<name>[.<id>]`
 *   - target is `jobs.due.<lane>.<owner>.<action>[.<id>]` — the lane is
 *     derived from the target prefix, never trusted from input
 *   - for route-declared schedules, <owner> MUST equal the caller's
 *     service code (parsed from its UA) — a service can only arm its own
 *     namespace; trigger schedules are declared by primebrick-job
 *     itself (owner "job")
 *   - every arm/disarm is mirrored in job.job_schedules (observability)
 */

import {
  ensureJobSchedule,
  cancelJobSchedule,
  getJobSchedule,
  listJobScheduleSubjects,
} from "../nats/schedule-mechanism.js";
import { JOB_SCHEDULE_SUBJECT_HEADER, logger, NatsClient } from "@primebrick/sdk";
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
   * differs from the NATS fire target — triggers arm on the JH-internal
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

// ─── Per-subject single-flight ──────────────────────────────────────────────

const subjectLocks = new Map<string, Promise<unknown>>();

/**
 * Serialize operations on the same schedule subject — an arm racing a
 * disarm (or two arms) can never interleave their NATS/mirror steps.
 * Locks release when the queue drains; per-subject only, never global.
 */
async function withSubjectLock<T>(subject: string, fn: () => Promise<T>): Promise<T> {
  const prev = subjectLocks.get(subject) ?? Promise.resolve();
  const next = prev.then(fn, fn); // run regardless of the previous outcome
  subjectLocks.set(subject, next);
  try {
    return await next;
  } finally {
    if (subjectLocks.get(subject) === next) subjectLocks.delete(subject);
  }
}

// ─── Spec helpers ───────────────────────────────────────────────────────────

/** `Nats-Schedule-TTL` durations (`30s`, `15m`, `168h`, `7d`) → ms. */
export function ttlToMs(ttl: string): number | undefined {
  const m = /^(\d+)(ms|s|m|h|d)$/.exec(ttl.trim());
  if (!m) return undefined;
  const unit = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2] as "ms" | "s" | "m" | "h" | "d"];
  return Number(m[1]) * unit;
}

/** The instant a `@at <ts>` spec fires, or null when not a one-shot. */
export function atInstant(spec: string): Date | null {
  if (!spec.trim().startsWith("@at")) return null;
  const at = new Date(spec.trim().slice(3).trim());
  return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Expected absence: does the mirror allow the declaration to be gone
 * without drift? `once` whose `@at` already passed (self-purges after
 * firing), or a recurring spec past its `expires_at` (TTL self-purge).
 */
function expectedDeclarationGone(row: JobScheduleEntity, now = new Date()): "fired" | "expired" | null {
  if (row.schedule_type === "once") {
    const at = atInstant(row.schedule_spec);
    if (at && at.getTime() <= now.getTime()) return "fired";
    return null;
  }
  if (row.expires_at && row.expires_at.getTime() <= now.getTime()) return "expired";
  return null;
}

// ─── Arm / disarm — atomic protocol ─────────────────────────────────────────

export async function declareSchedule(
  input: DeclareScheduleInput,
): Promise<{ seq?: bigint; skipped?: "terminal-once" | `suppressed:${string}` }> {
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
  // Internal callers (triggers engine) own the "job" namespace and MAY
  // target any service's due subject — that's the point of triggers.

  return withSubjectLock(input.schedule_subject, async () => {
    // Terminal-once gate — a `once` mirror row that already reached
    // `fired`/`expired` for the SAME spec must never re-declare: a past
    // `@at` FIRES IMMEDIATELY at declare time (verified live: a JH
    // restart re-armed a fired trigger and the job ran a second time
    // ~250ms later). A changed spec is a new lifecycle and arms normally.
    const dal = getDal();
    const existingRows = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
      filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", input.schedule_subject)],
    });
    const existing = Array.isArray(existingRows) ? existingRows[0] : undefined;
    if (
      input.schedule.startsWith("@at") &&
      existing !== undefined &&
      (existing.status === "fired" || existing.status === "expired") &&
      existing.schedule_spec === input.schedule
    ) {
      logger.done(
        `schedule arm skipped — once already ${existing.status} for the same spec on ${input.schedule_subject}`,
        { tags: ["jobs"] },
      );
      return { skipped: "terminal-once" as const };
    }

    // Admin-suppression gate — infra_derived only. An owner re-declare on
    // a `disarmed`/`paused` row is REFUSED: the admin deliberately stopped
    // the job and only an explicit arm/resume action clears it (otherwise
    // every service restart would resurrect disabled schedules). Trigger
    // rows are exempt — the engine owns their lifecycle and its
    // disarm-then-rearm refresh would deadlock against this gate; trigger
    // suppression lives on `job_triggers.enabled` + the paused row check
    // in dispatch/refreshTrigger.
    if (
      input.kind === "infra_derived" &&
      existing !== undefined &&
      SUPPRESSED_STATUSES.has(existing.status)
    ) {
      logger.warn(
        `schedule arm suppressed — ${existing.status} on ${input.schedule_subject} (admin hold; only arm-schedule/resume-schedule clears it)`,
        { tags: ["jobs"] },
      );
      return { skipped: `suppressed:${existing.status}` as const };
    }

    // Step 1 — declare. The declaration stamps its own schedule subject so
    // every fired message self-correlates (SDK middleware → jobs.result.*).
    const seq = await ensureJobSchedule({
      scheduleSubject: input.schedule_subject,
      schedule: input.schedule,
      target: input.target,
      payload: input.payload,
      source: input.source,
      ttl: input.ttl,
      forwardHeaders: {
        ...input.forwardHeaders,
        [JOB_SCHEDULE_SUBJECT_HEADER]: input.schedule_subject,
      },
    });

    // Step 2 — read-back verify. PubAck proves storage; the headers prove
    // the scheduler accepted the declaration (a spec the server silently
    // dropped would still sit stored — headers must round-trip verbatim).
    const decl = await getJobSchedule(input.schedule_subject);
    if (!decl || decl.schedule !== input.schedule || decl.target !== input.target) {
      throw new ScheduleDeclarationError(
        "ARM_VERIFY_FAILED",
        `declaration not schedulable on "${input.schedule_subject}" after PubAck ` +
          `(stored: ${decl ? `schedule=${decl.schedule} target=${decl.target}` : "nothing"})`,
      );
    }

    // Step 3 — mirror upsert. Failure compensates: purge the declaration —
    // a live schedule without a row is an orphan by design, and orphans
    // are now impossible to produce through code.
    const ttlMs = input.ttl ? ttlToMs(input.ttl) : undefined;
    try {
      const armedAt = new Date();
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
        armed_at: armedAt,
        disarmed_at: undefined,
        fired_at: undefined,
        expires_at: ttlMs === undefined ? undefined : new Date(armedAt.getTime() + ttlMs),
      };
      const actor = input.caller_service ?? input.initiator ?? "system:primebrick-job";
      if (existing !== undefined) {
        await dal.update(
          JobScheduleEntity,
          { ...row, uuid: existing.uuid, version: existing.version } as never,
          { actor, matchBy: "uuid" } as never,
        );
      } else {
        await dal.add(JobScheduleEntity, row as never, { actor } as never);
      }
    } catch (mirrorError) {
      const rest = input.schedule_subject.replace(/^jobs\.schedule\./, "");
      await cancelJobSchedule(input.schedule_subject, `jobs.cancel.${rest}`).catch((purgeError) => {
        logger.error(
          `arm compensation failed: could not purge ${input.schedule_subject} (${String(purgeError)}) — strict reconcile must clean this orphan`,
          { tags: ["jobs"] },
        );
      });
      throw new ScheduleDeclarationError(
        "MIRROR_WRITE_FAILED",
        `schedule declared on NATS but the mirror write failed (${String(mirrorError)}) — declaration compensated`,
      );
    }

    logger.done(
      `schedule armed: ${input.schedule_subject} → ${input.target} (${input.schedule})`,
      { tags: ["jobs"] },
    );
    return { seq };
  });
}

/**
 * Mirror statuses that SUPPRESS re-arm — an admin deliberately stopped
 * this schedule; only an explicit arm/resume action may clear them.
 * `disarmed` = permanent off; `paused` = suspended until resume.
 */
export const SUPPRESSED_STATUSES = new Set(["disarmed", "paused"]);

/**
 * Disarm — cancel + read-back-absent verify + registry flip. Idempotent.
 * `to` is the status the mirror lands on:
 *   "disarmed" = admin disable (sticky suppressor — owner re-declares refused)
 *   "paused"   = suspended until resume (suppressor, enabled intent kept)
 *   "stopped"  = instance kill (temporary — owner/engine may re-arm)
 */
export async function disarmSchedule(
  scheduleSubject: string,
  actor: string,
  to: "disarmed" | "stopped" | "paused" = "disarmed",
): Promise<void> {
  if (!SUBJECT_RE.test(scheduleSubject)) {
    throw new ScheduleDeclarationError(
      "INVALID_SCHEDULE_SUBJECT",
      `schedule_subject must be jobs.schedule.<owner>.<name>[.<id>], got "${scheduleSubject}"`,
    );
  }
  return withSubjectLock(scheduleSubject, async () => {
    const rest = scheduleSubject.replace(/^jobs\.schedule\./, "");
    await cancelJobSchedule(scheduleSubject, `jobs.cancel.${rest}`);

    // Read-back verify — the purge is applied at PubAck, so a surviving
    // declaration here is a real protocol violation: the mirror MUST NOT
    // flip while NATS can still fire.
    if ((await getJobSchedule(scheduleSubject)) !== null) {
      throw new ScheduleDeclarationError(
        "DISARM_VERIFY_FAILED",
        `declaration on "${scheduleSubject}" survived its purge PubAck — mirror left armed`,
      );
    }

    const dal = getDal();
    const rows = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
      filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject)],
    });
    if (Array.isArray(rows) && rows.length > 0) {
      await dal.update(
        JobScheduleEntity,
        {
          uuid: rows[0]!.uuid,
          status: to,
          disarmed_at: new Date(),
          version: rows[0]!.version,
        } as never,
        { actor, matchBy: "uuid" } as never,
      );
    }
    logger.done(`schedule ${to}: ${scheduleSubject}`, { tags: ["jobs"] });
  });
}

/**
 * Delete the mirror row entirely — called when the owning object no
 * longer exists (trigger deleted): a disarmed tombstone would list a
 * schedule nobody can ever re-arm. The declaration must already be gone
 * (call disarmSchedule first); the row is a mirror, not a document.
 */
/** Read the mirror row for a schedule subject (null when absent). */
export async function getScheduleRow(scheduleSubject: string): Promise<JobScheduleEntity | undefined> {
  const rows = await getDal().findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject)],
  });
  return Array.isArray(rows) && rows.length > 0 ? (rows[0] as JobScheduleEntity) : undefined;
}

/**
 * Clear an admin suppression — `disarmed`/`paused` → `stopped` (the
 * unsuppressed not-armed state). The caller then re-arms through the
 * owning path: engine `refreshTrigger` for kind=trigger, or the
 * `jobs.ctl.schedule.rearm.<svc>` ping for infra_derived (the owner
 * re-declares with fresh payload/headers — JH cannot fabricate them).
 * Returns the updated row's kind/service for the caller's re-arm path.
 */
export async function unsuppressSchedule(
  scheduleSubject: string,
  actor: string,
): Promise<JobScheduleEntity | undefined> {
  const row = await getScheduleRow(scheduleSubject);
  if (!row || !SUPPRESSED_STATUSES.has(row.status)) return row;
  await getDal().update(
    JobScheduleEntity,
    { uuid: row.uuid, status: "stopped", version: row.version } as never,
    { actor, matchBy: "uuid" } as never,
  );
  logger.done(`schedule unsuppressed (stopped → awaiting re-arm): ${scheduleSubject}`, { tags: ["jobs"] });
  return { ...row, status: "stopped" } as JobScheduleEntity;
}

/** Publish the owner re-arm request — `jobs.ctl.schedule.rearm.<svc>`;
 *  the owning service re-executes its own `jobs.ctl.schedule.request`
 *  arm with fresh payload/headers. Services without a rearm handler leave
 *  the row `armed`-missing — visible drift until natural re-declare. */
export async function requestOwnerRearm(scheduleSubject: string, serviceCode: string): Promise<void> {
  await NatsClient.publish(`jobs.ctl.schedule.rearm.${serviceCode}`, { schedule_subject: scheduleSubject });
  logger.done(`rearm requested to ${serviceCode} for ${scheduleSubject}`, { tags: ["jobs"] });
}

export async function dropScheduleMirror(scheduleSubject: string, actor: string): Promise<void> {
  const dal = getDal();
  const row = await getScheduleRow(scheduleSubject);
  if (!row) return;
  // job_schedules has no deleted_at — the mirror is a derived artifact,
  // not auditable state: the drop is physical (job_runs keep the
  // schedule_subject text, so history stays resolvable).
  await dal.hardDelete(
    JobScheduleEntity,
    { uuid: row.uuid, version: row.version } as never,
    { actor, matchBy: "uuid" } as never,
  );
}

/**
 * Flip a fired one-shot schedule to `fired` — called by the due-forwarder
 * after a successful dispatch of a `schedule_type=once` row. Without it
 * the mirror would say `armed` forever on a declaration NATS already
 * self-purged — a drift that does not exist.
 */
export async function markScheduleFired(scheduleSubject: string): Promise<void> {
  const dal = getDal();
  const rows = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [
      Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject),
      Filter.fieldValue(field(JobScheduleEntity, "schedule_type"), "=", "once"),
      Filter.fieldValue(field(JobScheduleEntity, "status"), "=", "armed"),
    ],
  });
  if (!Array.isArray(rows) || rows.length === 0) return;
  await dal.update(
    JobScheduleEntity,
    { uuid: rows[0]!.uuid, status: "fired", fired_at: new Date(), version: rows[0]!.version } as never,
    { actor: "system:job", matchBy: "uuid" } as never,
  );
}

/**
 * Reconcile the `job_schedules` registry mirror against the live JetStream
 * schedule declarations. Runs once at boot, AFTER `startTriggersEngine`
 * (the engine re-arms schedule-only triggers — reconciling first would
 * flag them as missing while it is still arming them).
 *
 * The DB rows are a MIRROR, not the truth — this pass enforces the truth:
 *
 *   row terminal (disarmed/fired/expired) + declaration live → PURGE —
 *     the mirror says the schedule must not fire; NATS disagrees; NATS
 *     loses. Includes the direct-SQL-bypass drift and out-of-band
 *     re-declarations.
 *   row armed + declaration missing → expected absence self-heals the
 *     row (once + past @at → `fired`; recurring + past expires_at →
 *     `expired`); anything else is REPORTED armed-missing (the row can't
 *     re-declare itself — the payload lives in the NATS message).
 *   declaration live + no row → PURGE (strict). Every declaration is
 *     produced through this service — a declaration without a row can
 *     only come from out-of-band writes or a compensated arm race;
 *     neither may keep firing.
 *
 * Every per-subject failure is collected — reconcile never aborts the
 * boot and never claims success it didn't achieve.
 */
export interface ReconcileReport {
  /** terminal row + live declaration → declaration was purged. */
  purged_stale: string[];
  /** live declaration with no registry row → purged (strict). */
  purged_orphan: string[];
  /** armed row + missing declaration → row self-healed to fired/expired. */
  self_healed: { subject: string; to: "fired" | "expired" }[];
  /** kind=trigger armed-missing → re-derived via the engine's refreshTrigger. */
  trigger_rescued: string[];
  /** armed row with no live declaration → surfaced (owner re-declares). */
  armed_missing: string[];
  errors: { subject: string; error: string }[];
}

let lastReconcileReport: ReconcileReport | null = null;

/** The most recent boot reconcile outcome — for drift surfacing/health. */
export function getLastReconcileReport(): ReconcileReport | null {
  return lastReconcileReport;
}

/**
 * Expected-gone statuses — a live declaration on one of these is `stale`
 * drift (dangerous); absent is healthy. `stopped`/`paused`/`disarmed` are
 * deliberate absences; `fired`/`expired` are terminal lifecycle ends.
 */
const TERMINAL_STATUSES = new Set(["disarmed", "stopped", "paused", "fired", "expired"]);

export async function reconcileSchedules(opts?: {
  /** kind=trigger rescue — the engine re-derives the schedule from its
   * trigger record (`refreshTrigger`). Injected by index.ts to keep
   * schedule-service free of the engine dependency. */
  rescueTrigger?: (uuid: string) => Promise<void>;
}): Promise<ReconcileReport> {
  const report: ReconcileReport = {
    purged_stale: [], purged_orphan: [], self_healed: [], trigger_rescued: [], armed_missing: [], errors: [],
  };
  const dal = getDal();
  const rows = (await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {})) as JobScheduleEntity[];
  const knownSubjects = new Set<string>();
  const now = new Date();

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
    if (TERMINAL_STATUSES.has(row.status) && live) {
      try {
        const rest = subject.replace(/^jobs\.schedule\./, "");
        await cancelJobSchedule(subject, `jobs.cancel.${rest}`);
        report.purged_stale.push(subject);
        logger.warn(`reconcile: purged stale declaration ${subject} (row ${row.status})`, { tags: ["jobs"] });
      } catch (error) {
        report.errors.push({ subject, error: `purge failed: ${String(error)}` });
      }
    } else if (row.status === "armed" && !live) {
      const heal = expectedDeclarationGone(row, now);
      if (heal) {
        try {
          await dal.update(
            JobScheduleEntity,
            {
              uuid: row.uuid,
              status: heal,
              fired_at: heal === "fired" ? now : undefined,
              version: row.version,
            } as never,
            { actor: "system:reconcile", matchBy: "uuid" } as never,
          );
          report.self_healed.push({ subject, to: heal });
        } catch (error) {
          report.errors.push({ subject, error: `self-heal to ${heal} failed: ${String(error)}` });
        }
      } else if (row.kind === "trigger" && row.trigger_uuid && opts?.rescueTrigger) {
        try {
          await opts.rescueTrigger(row.trigger_uuid);
          report.trigger_rescued.push(subject);
          logger.warn(`reconcile: re-derived trigger schedule ${subject}`, { tags: ["jobs"] });
        } catch (error) {
          report.errors.push({ subject, error: `trigger rescue failed: ${String(error)}` });
        }
      } else {
        report.armed_missing.push(subject);
        logger.warn(
          `reconcile: row armed but declaration missing: ${subject} (kind=${row.kind}) — owner/engine must re-declare`,
          { tags: ["jobs"] },
        );
      }
    }
  }

  // Direction 2: NATS → registry (orphans — strict purge: JH is the only
  // writer, so a declaration without a row is never legitimate).
  let liveSubjects: string[] = [];
  try {
    liveSubjects = await listJobScheduleSubjects();
  } catch (error) {
    report.errors.push({ subject: "jobs.schedule.>", error: `enumeration failed: ${String(error)}` });
  }
  for (const subject of liveSubjects) {
    if (knownSubjects.has(subject)) continue;
    try {
      const rest = subject.replace(/^jobs\.schedule\./, "");
      await cancelJobSchedule(subject, `jobs.cancel.${rest}`);
      report.purged_orphan.push(subject);
      logger.warn(`reconcile: purged orphan declaration ${subject} (no registry row)`, { tags: ["jobs"] });
    } catch (error) {
      report.errors.push({ subject, error: `orphan purge failed: ${String(error)}` });
    }
  }

  lastReconcileReport = report;
  logger.done(
    `schedule reconcile: ${report.purged_stale.length} stale-purged, ${report.purged_orphan.length} orphan-purged, ` +
      `${report.self_healed.length} self-healed, ${report.trigger_rescued.length} trigger-rescued, ` +
      `${report.armed_missing.length} armed-missing, ${report.errors.length} errors`,
    { tags: ["jobs"] },
  );
  return report;
}

// ─── Drift surfacing (list/get decoration) ──────────────────────────────────

export type ScheduleDrift = "stale" | "missing" | null;

/**
 * Compute the live/drift decoration for one mirror row against the set of
 * live declaration subjects. `live === undefined` = enumeration failed —
 * drift is then unknown (left null, never guessed).
 */
export function scheduleDrift(
  row: { schedule_subject: string; status: string; schedule_type?: string; schedule_spec?: string; expires_at?: Date | null },
  live: boolean | undefined,
): { live: boolean | undefined; drift: ScheduleDrift } {
  if (live === undefined) return { live: undefined, drift: null };
  if (TERMINAL_STATUSES.has(row.status)) {
    // Mirror says it must not fire; NATS still can — the dangerous drift.
    return { live, drift: live ? "stale" : null };
  }
  if (row.status === "armed") {
    if (live) return { live, drift: null };
    // Armed with no declaration: real drift unless the absence is expected
    // (past one-shot self-purged after firing / TTL expiry).
    const gone = expectedDeclarationGone(row as JobScheduleEntity);
    return { live, drift: gone === null ? "missing" : null };
  }
  return { live, drift: null };
}

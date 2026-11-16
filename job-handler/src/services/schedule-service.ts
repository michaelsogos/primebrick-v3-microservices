/**
 * schedule-service — the ONLY writer of `jobs.schedule.*` declarations.
 *
 * Every arm/disarm flows through here: the triggers engine (the ONLY
 * armer — a module's system jobs arrive via
 * `jobs.ctl.triggers.materialize` onto `job_triggers`, and the engine
 * re-derives their schedules) and the admin HTTP action. The raw
 * mechanism lives in `../nats/schedule-mechanism.ts` — job-handler
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
 *   - schedule_subject is `jobs.schedule.<owner>.<name>[.<id>]` — every
 *     mirror is owned by a `job_triggers` row (trigger_uuid); schedules
 *     are declared by primebrick-job itself (owner "job")
 *   - target is `jobs.due.<lane>.<owner>.<action>[.<id>]` — the lane is
 *     derived from the target prefix, never trusted from input
 *   - every arm/disarm is mirrored in job.job_schedules (observability)
 */

import {
  ensureJobSchedule,
  cancelJobSchedule,
  getJobSchedule,
  listJobScheduleSubjects,
  toNatsScheduleSpec,
} from "../nats/schedule-mechanism.js";
import {
  JOB_SCHEDULE_SUBJECT_HEADER,
  logger,
  MIN_SCHEDULE_INTERVAL_MS,
  NatsClient,
  nextScheduleFire,
  scheduleEveryMs,
} from "@primebrick/sdk";
import { toUUID } from "@primebrick/dal-pg";
import { JobScheduleEntity } from "../domain/entities/job_schedule_entity.js";
import { JobSchedulesService } from "../modules/jobs/jobs.service.js";
import { expectedDeclarationGone, scheduleDrift, TERMINAL_STATUSES } from "./schedule-drift.js";

// Re-export for consumers that already bind against this module's surface
// (actions-route drift diagnostic). The logic lives in the leaf module
// schedule-drift.ts — pure, no dal/nats — so JobSchedulesService can
// import it without a circular dependency through this file.
export { scheduleDrift, atInstant, type ScheduleDrift } from "./schedule-drift.js";

/** Owning entity surface — module-scope (I/O-free ctor, lazy DAL). */
const schedules = new JobSchedulesService();

export interface DeclareScheduleInput {
  schedule_subject: string;
  schedule: string;
  target: string;
  payload?: unknown;
  source?: string;
  ttl?: string;
  forwardHeaders?: Record<string, string>;
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
  const tm = TARGET_RE.exec(input.target);
  if (!tm) {
    throw new ScheduleDeclarationError(
      "INVALID_TARGET_SUBJECT",
      `target must be jobs.due.user|system.<owner>.<action>[.<id>], got "${input.target}"`,
    );
  }
  const lane = tm[1]! as "user" | "system";
  const targetOwner = tm[2]!;
  // Minute floor — the engine's own invariant, independent of the
  // write-path validation: a sub-minute spec that reached the arm path
  // through any channel (SQL seed, stale row, unvalidated caller) must
  // not declare. `@at`/cron are exempt by construction (one-shot; the
  // 5-field grammar cannot go below a minute).
  const everyMs = scheduleEveryMs(input.schedule);
  if (everyMs !== undefined && everyMs < MIN_SCHEDULE_INTERVAL_MS) {
    throw new ScheduleDeclarationError(
      "SCHEDULE_BELOW_MIN_INTERVAL",
      `schedule "${input.schedule}" fires below the ${MIN_SCHEDULE_INTERVAL_MS / 1000}s minimum — sub-minute jobs are a design error`,
    );
  }
  // Internal caller only (the triggers engine) — the "job" namespace MAY
  // target any service's due subject: that's the point of triggers. The
  // retired `jobs.ctl.schedule.request` remote surface is gone; services
  // declare jobs through `jobs.ctl.triggers.materialize` and the engine
  // arms the schedule itself.
  void targetOwner;

  return withSubjectLock(input.schedule_subject, async () => {
    // Terminal-once gate — a `once` mirror row that already reached
    // `fired`/`expired` for the SAME spec must never re-declare: a past
    // `@at` FIRES IMMEDIATELY at declare time (verified live: a JH
    // restart re-armed a fired trigger and the job ran a second time
    // ~250ms later). A changed spec is a new lifecycle and arms normally.
    const existing = await schedules.findBySubject(input.schedule_subject);
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

    // Suppression lives on the OWNING TRIGGER (`job_triggers.enabled`
    // soft-delete + the paused-row checks in dispatch/refreshTrigger) —
    // every mirror is trigger-owned, so the engine is the only armer and
    // its lifecycle checks already prevent any disabled resurrection.

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
    // Compare against the WIRE spec: the boundary converts our 5-field
    // cron to NATS's 6-field grammar (seconds-first, `0 ` prefix).
    const decl = await getJobSchedule(input.schedule_subject);
    if (!decl || decl.schedule !== toNatsScheduleSpec(input.schedule) || decl.target !== input.target) {
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
        run_as: lane,
        schedule_spec: input.schedule,
        schedule_type: input.schedule.startsWith("@at") ? "once" : "recurring",
        target_subject: input.mirror_target ?? input.target,
        status: "armed",
        trigger_uuid: input.trigger_uuid === undefined ? undefined : toUUID(input.trigger_uuid),
        armed_at: armedAt,
        disarmed_at: undefined,
        expires_at: ttlMs === undefined ? undefined : new Date(armedAt.getTime() + ttlMs),
        // Deterministic first-fire mirror — `@every`/`@at` compute exactly;
        // cron stays null until the server reports its own next fire via
        // `Nats-Schedule-Next` on the first fired message (single truth).
        next_fire_mirror_at: nextScheduleFire(input.schedule, { now: armedAt, since: armedAt }) ?? undefined,
      };
      // Honest system actor — `system:job` for engine materialization
      // (the only armer now). `created_by` is audit plumbing: provenance
      // lives on the `armed_by` projection (the owning trigger via
      // trigger_uuid), never on this stamp.
      const actor = "system:job";
      if (existing !== undefined) {
        await schedules.patchRow(existing.uuid, existing.version, row, actor);
      } else {
        await schedules.insertMirror(row, actor);
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

    const row = await schedules.findBySubject(scheduleSubject);
    if (row) {
      await schedules.patchRow(
        row.uuid,
        row.version,
        { status: to, disarmed_at: new Date(), next_fire_mirror_at: undefined },
        actor,
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
  return schedules.findBySubject(scheduleSubject);
}

/**
 * Clear an admin suppression — `disarmed`/`paused` → `stopped` (the
 * unsuppressed not-armed state). The caller then re-arms through the
 * owning path — the engine's `refreshTrigger` on the row's trigger_uuid.
 */
export async function unsuppressSchedule(
  scheduleSubject: string,
  actor: string,
): Promise<JobScheduleEntity | undefined> {
  const row = await getScheduleRow(scheduleSubject);
  if (!row || !SUPPRESSED_STATUSES.has(row.status)) return row;
  await schedules.patchRow(
    row.uuid,
    row.version,
    { status: "stopped", next_fire_mirror_at: undefined },
    actor,
  );
  logger.done(`schedule unsuppressed (stopped → awaiting re-arm): ${scheduleSubject}`, { tags: ["jobs"] });
  return { ...row, status: "stopped" } as JobScheduleEntity;
}

export async function dropScheduleMirror(scheduleSubject: string, actor: string): Promise<void> {
  const row = await getScheduleRow(scheduleSubject);
  if (!row) return;
  // job_schedules has no deleted_at — the mirror is a derived artifact,
  // not auditable state: the drop is physical (job_runs keep the
  // schedule_subject text, so history stays resolvable).
  await schedules.dropMirror(row.uuid, row.version, actor);
}

/**
 * Record a fire on the mirror — called by the due-forwarder on EVERY
 * dispatched schedule message.
 *   - `once`: the declaration self-purged, flip `fired` + clear
 *     `next_fire_mirror_at` (without it the mirror would say `armed`
 *     forever). The served `fired_at` derives from the run row — no
 *     write here.
 *   - `recurring`: stays `armed`; `next_fire_mirror_at` takes the
 *     server's own `Nats-Schedule-Next` header (RFC3339 — cron
 *     included), the single truth for when the next fire actually
 *     happens. `"purge"` means no further fire is scheduled.
 */
export async function markScheduleFired(scheduleSubject: string, nextFire?: Date | null): Promise<void> {
  const row = await schedules.findBySubject(scheduleSubject);
  if (!row || row.status !== "armed") return;
  if (row.schedule_type === "once") {
    await schedules.patchRow(
      row.uuid,
      row.version,
      { status: "fired", next_fire_mirror_at: undefined },
      "system:job",
    );
    return;
  }
  if (nextFire === undefined) return;
  await schedules.patchRow(
    row.uuid,
    row.version,
    { next_fire_mirror_at: nextFire ?? undefined },
    "system:job",
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
  /** armed-missing rows → re-derived via the engine's refreshTrigger. */
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

export async function reconcileSchedules(opts?: {
  /** Armed-missing rescue — the engine re-derives the schedule from its
   * owning trigger record (`refreshTrigger`). Injected by index.ts to
   * keep schedule-service free of the engine dependency. */
  rescueTrigger?: (uuid: string) => Promise<void>;
}): Promise<ReconcileReport> {
  const report: ReconcileReport = {
    purged_stale: [], purged_orphan: [], self_healed: [], trigger_rescued: [], armed_missing: [], errors: [],
  };
  const rows = await schedules.listAllRows();
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
          await schedules.patchRow(row.uuid, row.version, { status: heal }, "system:reconcile");
          report.self_healed.push({ subject, to: heal });
        } catch (error) {
          report.errors.push({ subject, error: `self-heal to ${heal} failed: ${String(error)}` });
        }
      } else if (row.trigger_uuid && opts?.rescueTrigger) {
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
          `reconcile: row armed but declaration missing: ${subject} — the owning trigger must re-derive`,
          { tags: ["jobs"] },
        );
      }
    } else if (row.status === "armed" && live && row.next_fire_mirror_at == null) {
      // Backfill the next-fire mirror — `@every`/`@at` recompute
      // deterministically (same formula as arm); cron stays null: the
      // server's own `Nats-Schedule-Next` writes it on the first fire.
      const next = nextScheduleFire(row.schedule_spec, { now, since: row.armed_at ?? undefined });
      if (next !== null) {
        try {
          await schedules.patchRow(
            row.uuid,
            row.version,
            { next_fire_mirror_at: next },
            "system:reconcile",
          );
        } catch (error) {
          report.errors.push({ subject, error: `next_fire_mirror_at backfill failed: ${String(error)}` });
        }
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

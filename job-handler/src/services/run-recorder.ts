/**
 * run-recorder — governance tap on `jobs.result.>` + dispatched-run sweeper.
 *
 * The SDK transport middleware emits one `JobResultMessage` per terminal
 * outcome on every consumer that received a correlated message (headers
 * `x-job-run-id` and/or `x-job-schedule-subject`). This durable consumer
 * folds them into `job.job_runs`:
 *
 *   run_id present        → UPDATE the forwarder's `dispatched` row —
 *                           the callable's REAL outcome lands on the row
 *                           the dispatch created (dispatched → succeeded /
 *                           failed). Late results legitimately overwrite a
 *                           `lost` sweep verdict: evidence beats timeout.
 *   schedule_subject only → INSERT a completed row — own-lane executions
 *                           (a service consuming its own `jobs.due.*` fire
 *                           directly, e.g. `ai`'s consumers) never passed
 *                           the forwarder, so no dispatched row exists.
 *   `jobs.due.*.job.forward.*` targets → SKIPPED: the trampoline hop is
 *                           JH-internal and the forwarder already records
 *                           its own dispatch row — a second row per hop
 *                           would be noise, not observability.
 *
 * Sweeper: a `dispatched` row that never receives a result means the
 * callable never consumed the fire (service down on a core-subject
 * publish = message evaporated) or the result publish itself failed.
 * After DISPATCH_LOST_AFTER_MS the row is honestly marked `lost` —
 * never left pretending it might still report.
 */

import {
  NatsClient,
  dueLaneVerify,
  extJsonStringify,
  setProcessInterval,
  logger,
  type JobResultMessage,
} from "@primebrick/sdk";
import { JobRunsService } from "../modules/jobs/jobs.service.js";
import { getScheduleRow } from "./schedule-service.js";

/** Owning entity surface — module-scope (I/O-free ctor, lazy DAL). */
const runs = new JobRunsService();

export const JOBS_STREAM = "JOBS";

/** A dispatched run with no result after this long never reports — `lost`. */
const DISPATCH_LOST_AFTER_MS = 5 * 60_000;
const SWEEP_INTERVAL_MS = 60_000;

/**
 * NatsClient decodes payloads with extJsonParse — every integer arrives as
 * native bigint. node-pg serializes object params with plain JSON.stringify,
 * which rejects bigint; fold them back to plain JSON before the jsonb insert
 * (jsonb has no distinct bigint type anyway).
 */
function plainJson<T>(v: T): T {
  if (v === undefined) return v;
  // The round-trip must NOT extJsonParse (that would re-bigintify) —
  // the whole point is folding bigint → number.
  return JSON.parse(extJsonStringify(v)) as T; // standards-exempt: ext-json — sanitizer needs plain parse
}

/** JH-internal trampoline outcomes — the forwarder records these itself. */
const FORWARD_TARGET_RE = /^jobs\.due\.(?:user|system)\.job\.forward\./;

/**
 * Closed `error_code` vocabulary — the union JH stamps plus the SDK
 * transport's contract codes (`job-contract.ts`). A callable may report
 * any string: outside this set the run normalizes to `EXECUTION_ERROR`
 * and the original code is preserved at the head of `error_detail`, so
 * the badge enum can never render a raw/unmapped value.
 */
const KNOWN_ERROR_CODES = new Set([
  "EXECUTION_ERROR",
  "HANDLER_ERROR",
  "DENIED",
  "VALIDATION_ERROR",
  "DISPATCH_ERROR",
  "DISPATCH_TIMEOUT",
  "AUTH_ACTOR_UNRESOLVABLE",
  "SCHEDULE_PAUSED",
  "SCHEDULE_DISARMED",
]);

function normalizeError(code: string | undefined, detail: string | undefined): { code: string; detail: string } {
  if (code === undefined || KNOWN_ERROR_CODES.has(code)) {
    return { code: code ?? "EXECUTION_ERROR", detail: (detail ?? "").slice(0, 2000) };
  }
  return {
    code: "EXECUTION_ERROR",
    detail: `reported error_code: ${code}${detail ? ` — ${detail}` : ""}`.slice(0, 2000),
  };
}

/**
 * Derive `{ service_code, name, run_as }` from the consumed subject
 * the result reports on (`msg.target`): `jobs.due.<lane>.<svc>.<action>`
 * strips the lane prefix, plain callable subjects (`emailsender.send`)
 * parse directly. `run_as` is `system` unless the due subject says `user`.
 * `service_code` never lands on a row — it only stamps the `created_by`
 * actor (`system:<svc>` = own-lane self-recording), same provenance
 * contract schedules use.
 */
function parseTarget(target: string): { service_code: string; name: string; run_as: "user" | "system" } | null {
  const due = /^jobs\.due\.(user|system)\.([a-z0-9-]+)\.([a-z0-9.-]+)$/.exec(target);
  if (due) return { service_code: due[2]!, name: due[3]!, run_as: due[1]! as "user" | "system" };
  const plain = /^([a-z0-9-]+)\.([a-z0-9.-]+)$/.exec(target);
  if (plain) return { service_code: plain[1]!, name: target, run_as: "system" };
  return null;
}

/**
 * UPDATE the `dispatched` row the forwarder inserted before stamping
 * `x-job-run-id`. Last write wins: redelivered executions and late
 * results after a `lost` verdict all land here — the most recent
 * outcome is the most truthful.
 */
async function correlateRun(data: JobResultMessage, redeliveryCount?: number): Promise<boolean> {
  const row = await runs.findByUuid(data.run_id!);
  if (!row) return false;
  const isError = data.status === "failed";
  const err = isError ? normalizeError(data.error_code, data.error_detail) : undefined;
  await runs.patchRow(
    row.uuid,
    row.version,
    {
      status: data.status,
      error_code: err?.code,
      error_detail: err?.detail,
      duration_ms: data.duration_ms === undefined ? undefined : BigInt(data.duration_ms),
      // COALESCE semantics: the forwarder-stamped due-fire seq is
      // canonical — the report's seq fills only rows that never crossed
      // the forwarder with one (legacy inserts, edge paths).
      fire_seq: row.fire_seq ?? (data.fire_seq === undefined ? undefined : BigInt(data.fire_seq)),
      redelivery_count: redeliveryCount,
      report: plainJson(data.report),
    },
    "system:job",
  );
  return true;
}

/**
 * INSERT a completed row for an execution that never crossed the
 * forwarder — own-lane due consumers correlate by `schedule_subject`.
 */
async function recordDirectRun(data: JobResultMessage, redeliveryCount?: number): Promise<void> {
  const parsed = parseTarget(data.target ?? "");
  const isError = data.status === "failed";
  const err = isError ? normalizeError(data.error_code, data.error_detail) : undefined;
  // Best-effort lineage: own-lane runs bypass the forwarder, so the
  // trigger stamp comes from the live mirror row when one still exists.
  const scheduleRow = data.schedule_subject
    ? await getScheduleRow(data.schedule_subject).catch(() => undefined)
    : undefined;
  await runs.addRun(
    {
      schedule_subject: data.schedule_subject,
      schedule_uuid: scheduleRow?.uuid,
      trigger_uuid: scheduleRow?.trigger_uuid,
      // Declared name first — the live mirror's stamp is the authored
      // identity; the subject-tail parse is the legacy own-lane fallback
      // for rows whose mirror is already gone.
      name: scheduleRow?.name ?? parsed?.name ?? data.target ?? "unknown",
      target_subject: data.target,
      run_as: parsed?.run_as ?? "system",
      status: data.status,
      error_code: err?.code,
      error_detail: err?.detail,
      duration_ms: data.duration_ms === undefined ? undefined : BigInt(data.duration_ms),
      fire_seq: data.fire_seq === undefined ? undefined : BigInt(data.fire_seq),
      redelivery_count: redeliveryCount,
      report: plainJson(data.report),
    },
    `system:${parsed?.service_code ?? "job"}`,
  );
}

/**
 * Dispatched runs older than DISPATCH_LOST_AFTER_MS → `lost`. Honest
 * terminal state: either the callable never consumed (service down on a
 * core-subject publish — the message evaporated) or its result publish
 * failed. A late result still rewrites the row — `lost` is a verdict,
 * not a tombstone.
 */
async function sweepLostRuns(): Promise<void> {
  const cutoff = new Date(Date.now() - DISPATCH_LOST_AFTER_MS);
  const rows = await runs.listDispatchedBefore(cutoff);
  for (const row of rows) {
    try {
      await runs.patchRow(
        row.uuid,
        row.version,
        {
          status: "lost",
          error_code: "DISPATCH_TIMEOUT",
          error_detail: `no execution result within ${DISPATCH_LOST_AFTER_MS / 1000}s of dispatch`,
        },
        "system:job",
      );
      logger.warn(`run-recorder: run ${row.uuid} (${row.name}) dispatched but never reported — lost`, {
        tags: ["jobs"],
      });
    } catch (err) {
      logger.warn(`run-recorder: lost-sweep update failed for ${row.uuid} (${String(err)})`, { tags: ["jobs"] });
    }
  }
}

export async function startRunRecorder(): Promise<void> {
  await NatsClient.jetstreamSubscribe<JobResultMessage>({
    stream: JOBS_STREAM,
    durable: "job-results-recorder",
    filterSubject: "jobs.result.>",
    verify: dueLaneVerify("system"),
    handler: async (data, meta) => {
      if (data.target && FORWARD_TARGET_RE.test(data.target)) {
        return; // internal trampoline hop — forwarder records its own row
      }
      if (data.run_id) {
        const correlated = await correlateRun(data, meta.info?.redeliveryCount);
        if (correlated) return;
        logger.warn(
          `run-recorder: result for unknown run_id ${data.run_id} on "${meta.subject}" — recording unlinked`,
          { tags: ["jobs"] },
        );
      }
      if (data.schedule_subject === undefined && data.run_id === undefined) {
        // The middleware only emits for correlated messages — an empty
        // envelope means a producer bypassed it; still worth a row only
        // if it carries enough identity to be useful.
        logger.warn(`run-recorder: uncorrelated result on "${meta.subject}" — dropped`, { tags: ["jobs"] });
        return;
      }
      await recordDirectRun(data, meta.info?.redeliveryCount);
    },
  });

  setProcessInterval("job-run-sweeper", SWEEP_INTERVAL_MS, sweepLostRuns);

  logger.done("run-recorder: durable consumer ready on jobs.result.> (+ dispatched sweeper)", {
    tags: ["jobs"],
  });
}

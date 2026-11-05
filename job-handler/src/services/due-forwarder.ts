/**
 * due-forwarder — the JH-internal trampoline between JetStream schedules
 * and service-owned callable subjects.
 *
 * NATS message scheduling only fires on subjects captured by the JOBS
 * stream, and stream-captured messages never fan out to core queue
 * subscribers — a trigger's callable target (`emailsender.send`, …) is a
 * plain queue route, so the scheduler cannot publish to it directly.
 * The triggers engine therefore arms schedules on
 * `jobs.due.<lane>.job.forward.<trigger_uuid>` carrying a
 * `JobForwardEnvelope`; this consumer unwraps it and republishes the
 * already-mapped payload verbatim to the real callable subject, with
 * the same forwarded auth headers the due message carries.
 *
 * The callable service sees an ordinary domain call on its own subject —
 * nothing in the contract knows scheduling exists. Lane semantics are
 * preserved at this hop: `jobs.due.user.*` envelopes are verified with
 * the full user chain and their auth headers ride the republish;
 * `jobs.due.system.*` republishes without a user context (a permissioned
 * callable will then deny it — that IS the governance).
 */

import { NatsClient, forwardAuthHeaders, forwardedActor, dueLaneVerify, applyPayloadInjectors, serializeAuthUserToHeaders, getAuthConfig, getSdkCachePort, callNats, JOB_RUN_ID_HEADER, JOB_SCHEDULE_SUBJECT_HEADER, type AuthUser, logger } from "@primebrick/sdk";
import { getDal } from "../db/dal.js";
import { Filter, field } from "@primebrick/dal-pg";
import { JobRunEntity } from "../domain/entities/job_run_entity.js";
import { JOBS_STREAM } from "./run-recorder.js";
import { markScheduleFired } from "./schedule-service.js";

export const FORWARD_ENVELOPE_MARK = "__pb_job_forward";

/** Payload stored on the schedule message — the REAL destination is inside. */
export interface JobForwardEnvelope {
  [FORWARD_ENVELOPE_MARK]: true;
  /** Service-owned callable subject, e.g. `emailsender.send`. */
  target: string;
  /** Already-mapped request payload (verbatim for unmapped rules). */
  payload: unknown;
  /** Rule's schedule subject — links job_runs → job_schedules. */
  schedule_subject?: string;
  /** `trigger:<name>` — who armed this dispatch. */
  initiator?: string;
}

function isEnvelope(v: unknown): v is JobForwardEnvelope {
  return (
    v !== null &&
    typeof v === "object" &&
    (v as Record<string, unknown>)[FORWARD_ENVELOPE_MARK] === true &&
    typeof (v as JobForwardEnvelope).target === "string"
  );
}

/** Plain NATS subject — concrete only, no wildcards, no spaces. */
const CALLABLE_SUBJECT_RE = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;

/**
 * JH is the publisher — it records the dispatch itself (no due-tap).
 * The run row is inserted BEFORE the republish so its uuid becomes the
 * `x-job-run-id` stamped on the callable's message: the transport
 * middleware's `jobs.result.*` report then correlates the ACTUAL
 * execution outcome back to this row (dispatched → executed/failed; a
 * dispatched row that never hears back → the sweeper marks `lost`).
 * Every dispatch records — immediate envelopes (no schedule link) too.
 * A record failure must never block the dispatch: observability is a
 * tap, not a gate.
 */
async function insertRun(
  envelope: JobForwardEnvelope,
  lane: "user" | "system",
  status: "dispatched" | "failed",
  errorCode?: string,
  errorDetail?: string,
): Promise<string | undefined> {
  try {
    const row = await getDal().add<JobRunEntity>(
      JobRunEntity,
      {
        schedule_subject: envelope.schedule_subject,
        // The run executes ON the callable's service — derive it from the
        // target's first token (`emailsender.send` → `emailsender`).
        service_code: envelope.target.split(".")[0]!,
        job_name: envelope.target,
        lane,
        status,
        error_code: errorCode,
        error_detail: errorDetail?.slice(0, 2000),
        initiator: envelope.initiator,
      } as never,
      { actor: "system:job" } as never,
    );
    return (row as unknown as { uuid?: string })?.uuid;
  } catch (err) {
    logger.warn(`due-forwarder: run record failed for ${envelope.target} (${String(err)})`, { tags: ["jobs"] });
    return undefined;
  }
}

/** Flip a recorded run to `failed` — dispatch-level failures only. */
async function failRun(runUuid: string | undefined, detail: string): Promise<void> {
  if (!runUuid) return;
  try {
    const rows = await getDal().findAll<JobRunEntity>(JobRunEntity, null, {
      filters: [Filter.fieldValue(field(JobRunEntity, "uuid"), "=", runUuid)],
    });
    if (!Array.isArray(rows) || rows.length === 0) return;
    await getDal().update(
      JobRunEntity,
      {
        uuid: rows[0]!.uuid,
        status: "failed",
        error_code: "DISPATCH_ERROR",
        error_detail: detail.slice(0, 2000),
        version: rows[0]!.version,
      } as never,
      { actor: "system:job", matchBy: "uuid" } as never,
    );
  } catch (err) {
    logger.warn(`due-forwarder: run fail update failed (${String(err)})`, { tags: ["jobs"] });
  }
}

// ─── Fire-time auth-freshness checkpoint ────────────────────────────────────
//
// Every scheduled/immediate user-lane fire passes through here, so this is
// the single mechanical point where stale arm-time authorization is caught.
// The BE stamps `auth:epoch` (role/permission writes) and
// `auth:user_epoch:<uuid>` (direct user writes) in Redis; the snapshot under
// `auth:snap:<uuid>` is the last resolved AuthUser with its resolve time.
// A snapshot is fresh only when `taken_at` postdates both epochs — anything
// else (missing, TTL-expired, epoch-bumped) re-resolves through
// `auth.ctl.resolve_user`.
//
// Policy:
//   resolve returns a user     → fresh headers, snapshot refreshed
//   resolve returns null       → user deleted/disabled — REFUSE the fire
//                                (fail-closed governance)
//   resolve unreachable/errors → transient backend failure — fall back to
//                                the message's own headers (their provenance
//                                already passed dueLaneVerify) + warn. Stale
//                                authorization is bounded by retry, never
//                                silently trusted.
//
// The cache is a performance optimization, never the authority.

const AUTH_RESOLVE_USER_SUBJECT = "auth.ctl.resolve_user";
const AUTH_EPOCH_KEY = "auth:epoch";
const userEpochKey = (uuid: string) => `auth:user_epoch:${uuid}`;
const authSnapKey = (uuid: string) => `auth:snap:${uuid}`;
/** Safety-net TTL — real invalidation is epoch-driven. */
const AUTH_SNAP_TTL_MS = 6 * 60 * 60 * 1000;

type CachedAuthSnap = { user: AuthUser; taken_at: number };

async function freshAuthHeaders(
  actorUuid: string,
  msg: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] },
): Promise<Record<string, string> | null> {
  const port = getSdkCachePort();
  if (port) {
    try {
      const snap = await port.get<CachedAuthSnap>(authSnapKey(actorUuid));
      if (snap) {
        const gEpoch = (await port.get<number>(AUTH_EPOCH_KEY)) ?? 0;
        const uEpoch = (await port.get<number>(userEpochKey(actorUuid))) ?? 0;
        if (snap.taken_at > Math.max(gEpoch, uEpoch)) {
          return serializeAuthUserToHeaders(snap.user, getAuthConfig());
        }
      }
    } catch (err) {
      logger.warn(`auth checkpoint: cache read failed (${String(err)}) — resolving fresh`, { tags: ["jobs"] });
    }
  }

  let user: AuthUser | null;
  try {
    user = await callNats<AuthUser | null>(AUTH_RESOLVE_USER_SUBJECT, { user_uuid: actorUuid });
  } catch (err) {
    logger.warn(
      `auth checkpoint: auth.ctl.resolve_user unreachable (${String(err)}) — forwarding arm-time headers`,
      { tags: ["jobs"] },
    );
    return forwardAuthHeaders(msg);
  }
  if (!user) {
    logger.warn(
      `auth checkpoint: actor ${actorUuid} no longer resolves (deleted/disabled) — fire refused`,
      { tags: ["jobs"] },
    );
    return null;
  }
  if (port) {
    try {
      await port.set<CachedAuthSnap>(authSnapKey(actorUuid), { user, taken_at: Date.now() }, AUTH_SNAP_TTL_MS);
    } catch (err) {
      logger.warn(`auth checkpoint: snapshot set failed (${String(err)})`, { tags: ["jobs"] });
    }
  }
  return serializeAuthUserToHeaders(user, getAuthConfig());
}

async function forward(
  envelope: JobForwardEnvelope,
  lane: "user" | "system",
  msg: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] },
): Promise<void> {
  if (!CALLABLE_SUBJECT_RE.test(envelope.target)) {
    logger.warn(`due-forwarder: refusing invalid callable target "${envelope.target}"`, { tags: ["jobs"] });
    return;
  }
  // Fire-time auth checkpoint — user lane only. A refused return (null)
  // is authoritative: the actor no longer resolves, the fire must not
  // execute and the run is recorded as failed.
  let headers: Record<string, string>;
  const actorUuid = lane === "user" ? forwardedActor(msg).actor_uuid : undefined;
  if (lane === "user" && actorUuid) {
    const fresh = await freshAuthHeaders(actorUuid, msg);
    if (fresh === null) {
      await insertRun(envelope, lane, "failed", "AUTH_ACTOR_UNRESOLVABLE", "auth actor unresolvable (deleted/disabled)");
      return;
    }
    headers = fresh;
  } else {
    headers = forwardAuthHeaders(msg);
  }
  // Fire-time injectors — `{$inject:name}` markers the arm-time resolver
  // left in the payload resolve HERE, once per dispatch (uuid per send,
  // session actor off the due message's forwarded auth headers).
  const payload = applyPayloadInjectors(envelope.payload ?? null, {
    session_actor: actorUuid,
  });
  // Insert the run row FIRST — its uuid rides as `x-job-run-id` so the
  // callable's transport middleware reports the real outcome back.
  const runUuid = await insertRun(envelope, lane, "dispatched");
  const outHeaders: Record<string, string> = {
    ...headers,
    ...(envelope.schedule_subject
      ? { [JOB_SCHEDULE_SUBJECT_HEADER]: envelope.schedule_subject }
      : {}),
    ...(runUuid ? { [JOB_RUN_ID_HEADER]: runUuid } : {}),
  };
  let dispatchError: string | undefined;
  try {
    await NatsClient.publish(envelope.target, payload, outHeaders);
  } catch (err) {
    dispatchError = err instanceof Error ? err.message : String(err);
    await failRun(runUuid, dispatchError);
    logger.warn(`due-forwarder: publish to ${envelope.target} failed (${dispatchError})`, { tags: ["jobs"] });
  }
  // A one-shot consumed its single fire regardless of the dispatch
  // outcome — the declaration self-purged, the mirror flips `fired`
  // (the run row carries the outcome, the schedule status carries the
  // lifecycle truth: it will never fire again).
  if (envelope.schedule_subject) {
    await markScheduleFired(envelope.schedule_subject).catch((err) => {
      logger.warn(`due-forwarder: fired flip failed for ${envelope.schedule_subject} (${String(err)})`, { tags: ["jobs"] });
    });
  }
}

/**
 * Bind one durable consumer per lane on the JH-owned forward namespace.
 * The envelope arrives stream-captured; user-lane envelopes re-run the
 * full auth chain before their payload is re-sent, system-lane envelopes
 * only need the publisher shield.
 */
export async function startDueForwarder(): Promise<void> {
  await NatsClient.jetstreamSubscribe<JobForwardEnvelope>({
    stream: JOBS_STREAM,
    durable: "job-due-forwarder-user",
    filterSubject: "jobs.due.user.job.forward.>",
    verify: dueLaneVerify("user"),
    handler: async (envelope, msg) => {
      if (!isEnvelope(envelope)) {
        logger.warn("due-forwarder: dropping malformed forward envelope (user lane)", { tags: ["jobs"] });
        return;
      }
      await forward(envelope, "user", msg);
    },
  });
  await NatsClient.jetstreamSubscribe<JobForwardEnvelope>({
    stream: JOBS_STREAM,
    durable: "job-due-forwarder-system",
    filterSubject: "jobs.due.system.job.forward.>",
    verify: dueLaneVerify("system"),
    handler: async (envelope, msg) => {
      if (!isEnvelope(envelope)) {
        logger.warn("due-forwarder: dropping malformed forward envelope (system lane)", { tags: ["jobs"] });
        return;
      }
      await forward(envelope, "system", msg);
    },
  });
  logger.done("due-forwarder: durable consumers ready on jobs.due.*.job.forward.>", { tags: ["jobs"] });
}

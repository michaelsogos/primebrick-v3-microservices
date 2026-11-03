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

import { NatsClient, forwardAuthHeaders, forwardedActor, dueLaneVerify, applyPayloadInjectors, serializeAuthUserToHeaders, getAuthConfig, getSdkCachePort, callNats, type AuthUser, logger } from "@primebrick/sdk";
import { getDal } from "../db/dal.js";
import { JobRunEntity } from "../domain/entities/job_run_entity.js";
import { JOBS_STREAM } from "./run-recorder.js";

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
 * JH is the publisher — it records the dispatch itself (no due-tap). A
 * successful republish lands a `dispatched` run row linked to the rule's
 * schedule; a publish failure lands a `failed` row. Envelopes armed before
 * this contract (no schedule_subject) skip the record — they are replaced
 * the next time their rule's event fires.
 */
async function recordRun(
  envelope: JobForwardEnvelope,
  lane: "user" | "system",
  status: "dispatched" | "failed",
  errorDetail?: string,
): Promise<void> {
  if (!envelope.schedule_subject) return;
  try {
    await getDal().add<JobRunEntity>(
      JobRunEntity,
      {
        schedule_subject: envelope.schedule_subject,
        service_code: "job",
        job_name: envelope.target,
        lane,
        status,
        error_code: status === "failed" ? "DISPATCH_ERROR" : undefined,
        error_detail: errorDetail?.slice(0, 2000),
        initiator: envelope.initiator,
        report: { target: envelope.target },
      } as never,
      { actor: "system:job" } as never,
    );
  } catch (err) {
    logger.warn(`due-forwarder: run record failed for ${envelope.target} (${String(err)})`, { tags: ["jobs"] });
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
      await recordRun(envelope, lane, "failed", "auth actor unresolvable (deleted/disabled)");
      return;
    }
    headers = fresh;
  } else {
    headers = forwardAuthHeaders(msg);
  }
  try {
    // Fire-time injectors — `{$inject:name}` markers the arm-time resolver
    // left in the payload resolve HERE, once per dispatch (uuid per send,
    // session actor off the due message's forwarded auth headers).
    const payload = applyPayloadInjectors(envelope.payload ?? null, {
      session_actor: actorUuid,
    });
    await NatsClient.publish(envelope.target, payload, headers);
  } catch (err) {
    await recordRun(envelope, lane, "failed", err instanceof Error ? err.message : String(err));
    logger.warn(`due-forwarder: publish to ${envelope.target} failed (${String(err)})`, { tags: ["jobs"] });
    return;
  }
  await recordRun(envelope, lane, "dispatched");
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

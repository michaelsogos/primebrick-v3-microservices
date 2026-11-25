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

import { NatsClient, forwardAuthHeaders, forwardedActor, dueLaneVerify, applyPayloadInjectors, serializeAuthUserToHeaders, getAuthConfig, currentClientShieldSecret, getSdkCachePort, callNats, JOB_RUN_ID_HEADER, JOB_TRIGGER_ID_HEADER, JOB_SCHEDULE_SUBJECT_HEADER, JOB_SCHEDULE_HEADERS, type AuthUser, logger } from "@primebrick/sdk";
import { trampolineTriggerUuid } from "../domain/entities/job_trigger_entity.js";
import { JobRunsService } from "../modules/jobs/jobs.service.js";
import { JOBS_STREAM } from "./run-recorder.js";
import { getScheduleRow, markScheduleFired } from "./schedule-service.js";

/** Owning entity surface — module-scope (I/O-free ctor, lazy DAL). */
const runs = new JobRunsService();

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
 * execution outcome back to this row (dispatched → succeeded/failed; a
 * dispatched row that never hears back → the sweeper marks `lost`).
 * Every dispatch records — immediate envelopes (no schedule link) too.
 * A record failure must never block the dispatch: observability is a
 * tap, not a gate.
 */
async function insertRun(
  envelope: JobForwardEnvelope,
  lane: "user" | "system",
  status: "dispatched" | "failed" | "skipped",
  errorCode?: string,
  errorDetail?: string,
  fireSeq?: bigint,
  scheduleRow?: { uuid?: string; trigger_uuid?: string },
  triggerUuid?: string,
): Promise<string | undefined> {
  try {
    const row = await runs.addRun(
      {
        schedule_subject: envelope.schedule_subject,
        schedule_uuid: scheduleRow?.uuid,
        // The armed mirror's stamp wins where one exists (authoritative);
        // the trampoline subject tail is the trigger's own proof of
        // dispatch — every message on `job.forward.<uuid>` is trigger-
        // originated by grammar, so immediate fires resolve too.
        trigger_uuid: scheduleRow?.trigger_uuid ?? triggerUuid,
        target_subject: envelope.target,
        run_as: lane,
        status,
        error_code: errorCode,
        error_detail: errorDetail?.slice(0, 2000),
        // `fire_seq` = stream sequence of THE DUE FIRE — stamped at
        // insert on every path (dispatched/skipped/failed-early) so the
        // column is populated even for core-subscribed callables whose
        // result reports carry no `m.seq`.
        fire_seq: fireSeq,
      },
      "system:job",
    );
    return row?.uuid;
  } catch (err) {
    logger.warn(`due-forwarder: run record failed for ${envelope.target} (${String(err)})`, { tags: ["jobs"] });
    return undefined;
  }
}

/** Flip a recorded run to `failed` — dispatch-level failures only. */
async function failRun(runUuid: string | undefined, detail: string): Promise<void> {
  if (!runUuid) return;
  try {
    const row = await runs.findByUuid(runUuid);
    if (!row) return;
    await runs.patchRow(
      row.uuid,
      row.version,
      {
        status: "failed",
        error_code: "DISPATCH_ERROR",
        error_detail: detail.slice(0, 2000),
      },
      "system:job",
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
//   resolve unreachable/errors → transient backend failure — THROW: the
//                                handler naks, the message redelivers and
//                                auth is re-resolved on the next attempt.
//                                Forwarding arm-time headers here would let
//                                the callable accept STALE claims (roles/
//                                permissions frozen at arm time) — a bypass
//                                of this very checkpoint. Unverifiable
//                                authorization is never forwarded.
//
// The cache is a performance optimization, never the authority.

const AUTH_RESOLVE_USER_SUBJECT = "auth.ctl.resolve_user";
const AUTH_EPOCH_KEY = "auth:epoch";
const userEpochKey = (uuid: string) => `auth:user_epoch:${uuid}`;
const authSnapKey = (uuid: string) => `auth:snap:${uuid}`;
/** Safety-net TTL — real invalidation is epoch-driven. */
const AUTH_SNAP_TTL_MS = 6 * 60 * 60 * 1000;

type CachedAuthSnap = { user: AuthUser; taken_at: number };

/** Auth checkpoint unreachable — the fire defers to redelivery (handler nak). */
export class AuthCheckpointUnreachable extends Error {
  override name = "AuthCheckpointUnreachable";
}

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
    throw new AuthCheckpointUnreachable(
      `auth checkpoint: auth.ctl.resolve_user unreachable (${String(err)}) — fire deferred to redelivery`,
    );
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
  msg: {
    subject?: string;
    headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"];
    info?: { streamSequence?: number | bigint };
  },
): Promise<void> {
  if (!CALLABLE_SUBJECT_RE.test(envelope.target)) {
    logger.warn(`due-forwarder: refusing invalid callable target "${envelope.target}"`, { tags: ["jobs"] });
    return;
  }
  // The due fire's own stream sequence — the canonical `fire_seq` for
  // every run this envelope produces.
  const fireSeq =
    msg.info?.streamSequence === undefined ? undefined : BigInt(msg.info.streamSequence);
  // The trampoline subject tail IS the trigger uuid — every dispatch on
  // `job.forward.<uuid>` is trigger-originated by grammar.
  const trampolineUuid = msg.subject === undefined ? undefined : trampolineTriggerUuid(msg.subject);
  // Armed-only gate — a queued due is honored ONLY while its schedule is
  // still armed. pause/disarm/stop purge the declaration but queued dues
  // keep flowing to this consumer: honoring them would let suppressed
  // schedules keep executing. `skipped` runs are the audit trail — no
  // dead-letter queue needed (this IS the conservation layer).
  let scheduleRow: Awaited<ReturnType<typeof getScheduleRow>>;
  if (envelope.schedule_subject) {
    scheduleRow = await getScheduleRow(envelope.schedule_subject).catch(() => undefined);
    if (scheduleRow !== undefined && scheduleRow.status !== "armed") {
      await insertRun(envelope, lane, "skipped", `SCHEDULE_${scheduleRow.status.toUpperCase()}`, `suppressed: schedule status is ${scheduleRow.status}`, fireSeq, scheduleRow, trampolineUuid);
      return;
    }
  }
  // Fire-time auth checkpoint — user lane only. A refused return (null)
  // is authoritative: the actor no longer resolves, the fire must not
  // execute and the run is recorded as failed.
  let headers: Record<string, string>;
  const actorUuid = lane === "user" ? forwardedActor(msg).actor_uuid : undefined;
  if (lane === "user" && actorUuid) {
    const fresh = await freshAuthHeaders(actorUuid, msg);
    if (fresh === null) {
      await insertRun(envelope, lane, "failed", "AUTH_ACTOR_UNRESOLVABLE", "auth actor unresolvable (deleted/disabled)", fireSeq, scheduleRow, trampolineUuid);
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
  const runUuid = await insertRun(envelope, lane, "dispatched", undefined, undefined, fireSeq, scheduleRow, trampolineUuid);
  const triggerUuid = scheduleRow?.trigger_uuid ?? trampolineUuid;
  const outHeaders: Record<string, string> = {
    ...headers,
    ...(envelope.schedule_subject
      ? { [JOB_SCHEDULE_SUBJECT_HEADER]: envelope.schedule_subject }
      : {}),
    ...(runUuid ? { [JOB_RUN_ID_HEADER]: runUuid } : {}),
    ...(triggerUuid ? { [JOB_TRIGGER_ID_HEADER]: triggerUuid } : {}),
  };
  // Fire-time secret re-stamp — the forwarded headers carry the arm-time
  // snapshot of the rotating client-shield secret, which dies within the
  // grace window (rotation hourly, grace minutes). The publisher-side
  // contract is current-at-publish (sdk auth/client-shield-secret.ts) and
  // the forwarder IS the publisher at fire time: forwarding the stale
  // snapshot made every schedule firing past rotation fail verification
  // (AUTH_CLIENT_SHIELD_SECRET_INVALID). The user lane re-serializes
  // through freshAuthHeaders and was immune; the system lane was not.
  const gwConfig = getAuthConfig().gateway;
  const freshSecret = currentClientShieldSecret(gwConfig.secret);
  if (gwConfig.secret_header_name && freshSecret) {
    outHeaders[gwConfig.secret_header_name] = freshSecret;
  }
  let dispatchError: string | undefined;
  try {
    await NatsClient.publishEphemeralLossy(envelope.target, payload, outHeaders);
  } catch (err) {
    dispatchError = err instanceof Error ? err.message : String(err);
    await failRun(runUuid, dispatchError);
    logger.warn(`due-forwarder: publish to ${envelope.target} failed (${dispatchError})`, { tags: ["jobs"] });
  }
  // A one-shot consumed its single fire regardless of the dispatch
  // outcome — the declaration self-purged, the mirror flips `fired`
  // (the run row carries the outcome, the schedule status carries the
  // lifecycle truth: it will never fire again). Recurring schedules take
  // the server's own `Nats-Schedule-Next` into `next_fire_mirror_at` — the
  // authoritative next fire, cron included ("purge" = nothing more).
  if (envelope.schedule_subject) {
    const nextHdr = msg.headers?.get(JOB_SCHEDULE_HEADERS.next);
    const nextFire =
      nextHdr === undefined ? undefined : nextHdr === "purge" ? null : new Date(nextHdr);
    await markScheduleFired(envelope.schedule_subject, nextFire).catch((err) => {
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
    // Bound redelivery: poisoned messages (malformed, permanently
    // unauthorized, unresolvable targets) used to nak-loop forever.
    // 5 attempts is enough for transient outages — the run row then
    // ages to `lost` via the dispatch sweeper.
    consumer: { maxDeliver: 5 },
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
    consumer: { maxDeliver: 5 },
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

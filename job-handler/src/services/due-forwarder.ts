/**
 * due-forwarder — the JH-internal trampoline between JetStream schedules
 * and service-owned callable subjects.
 *
 * NATS message scheduling only fires on subjects captured by the JOBS
 * stream, and stream-captured messages never fan out to core queue
 * subscribers — a rule's callable target (`emailsender.send`, …) is a
 * plain queue route, so the scheduler cannot publish to it directly.
 * The rules engine therefore arms schedules on
 * `jobs.due.<lane>.job.forward.<rule_uuid>` carrying a
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

import { NatsClient, forwardAuthHeaders, forwardedActor, dueLaneVerify, applyPayloadInjectors, logger } from "@primebrick/sdk";
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
  /** `rule:<name>` — who armed this dispatch. */
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

async function forward(
  envelope: JobForwardEnvelope,
  lane: "user" | "system",
  msg: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] },
): Promise<void> {
  if (!CALLABLE_SUBJECT_RE.test(envelope.target)) {
    logger.warn(`due-forwarder: refusing invalid callable target "${envelope.target}"`, { tags: ["jobs"] });
    return;
  }
  try {
    // Fire-time injectors — `{$inject:name}` markers the arm-time resolver
    // left in the payload resolve HERE, once per dispatch (uuid per send,
    // session actor off the due message's forwarded auth headers).
    const payload = applyPayloadInjectors(envelope.payload ?? null, {
      session_actor: forwardedActor(msg).actor_uuid,
    });
    await NatsClient.publish(envelope.target, payload, forwardAuthHeaders(msg));
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

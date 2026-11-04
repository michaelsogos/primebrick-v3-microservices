/**
 * schedule-mechanism — the RAW JetStream schedule primitives, private to
 * primebrick-job. Moved out of the SDK on purpose: a service that could
 * call these directly could create a declaration with no mirror row (an
 * orphan by design). Every external caller goes through the governed
 * `jobs.ctl.schedule.request|cancel` routes → `schedule-service.ts`,
 * which wraps these primitives in the atomic protocol (PubAck →
 * read-back → mirror → compensation).
 *
 * Verified empirically against nats-server 2.14.3:
 *   - The purge inside a cancel publish is applied AT PubAck time — the
 *     declaration is already gone 1ms after the publish resolves, so the
 *     read-back verify in disarmSchedule is a real, synchronous check.
 *   - A publish on a `jobs.schedule.*` subject SUCCEEDS even when the
 *     declaration cannot schedule (e.g. missing `allow_msg_schedules`,
 *     invalid spec accepted then dropped): the PubAck proves storage,
 *     never schedulability — hence the read-back on arm.
 */

import { AckPolicy, JetStreamApiError } from "@nats-io/jetstream";
import { NatsClient, JOB_SCHEDULE_HEADERS } from "@primebrick/sdk";

export interface EnsureJobScheduleOpts {
  /**
   * Unique schedule subject — `jobs.schedule.<svc>.<name>[.<entity-id>]`.
   * One schedule per subject; republishing replaces it atomically.
   */
  scheduleSubject: string;
  /** `"@every 30s"` | `"@at 2025-12-01T09:00:00Z"` | cron expression. */
  schedule: string;
  /** Subject the stored message is republished to at fire time —
   *  `jobs.due.user.*` or `jobs.due.system.*`. Must be covered by the same
   *  stream's subjects. */
  target: string;
  /** Payload stored on the schedule message — fired verbatim unless
   *  `source` is set. Serialized via extJson by jetstreamPublish. */
  payload?: unknown;
  /** Fire-time indirection (ADR-51): at fire time the scheduler reads the
   *  LATEST message on this subject and fires THAT as the payload — the
   *  schedule declaration never holds business state. */
  source?: string;
  /** `Nats-Schedule-TTL` — auto-purge the schedule after this duration. */
  ttl?: string;
  /**
   * Extra headers stamped on the declaration and forwarded VERBATIM to the
   * fired message. For `jobs.due.user.*` targets pass the triggering
   * message's auth headers via `forwardAuthHeaders()` so the executor can
   * run the full L2+RBAC chain on the ORIGINATING user.
   */
  forwardHeaders?: Record<string, string>;
}

/**
 * Arm a JetStream schedule. Publishes the declaration message — the NATS
 * server itself republishes `payload`/`source` to `target` per `schedule`.
 * INTERNAL: only schedule-service may call this.
 */
export async function ensureJobSchedule(opts: EnsureJobScheduleOpts): Promise<bigint> {
  const hdrs: Record<string, string> = {
    ...opts.forwardHeaders,
    [JOB_SCHEDULE_HEADERS.schedule]: opts.schedule,
    [JOB_SCHEDULE_HEADERS.target]: opts.target,
  };
  if (opts.ttl) hdrs[JOB_SCHEDULE_HEADERS.ttl] = opts.ttl;
  if (opts.source) hdrs[JOB_SCHEDULE_HEADERS.source] = opts.source;
  return NatsClient.jetstreamPublish(opts.scheduleSubject, opts.payload ?? null, hdrs);
}

/**
 * Disarm a previously armed schedule. The cancellation MUST go to a
 * different subject than `scheduleSubject` (a same-subject publish would
 * just replace the declaration). INTERNAL: only schedule-service may call
 * this.
 */
export async function cancelJobSchedule(
  scheduleSubject: string,
  cancelSubject: string,
): Promise<bigint> {
  if (cancelSubject === scheduleSubject) {
    throw new Error(
      "cancelJobSchedule: cancelSubject must differ from scheduleSubject (same-subject publish replaces the schedule)",
    );
  }
  return NatsClient.jetstreamPublish(cancelSubject, null, {
    [JOB_SCHEDULE_HEADERS.next]: "purge",
    [JOB_SCHEDULE_HEADERS.scheduler]: scheduleSubject,
  });
}

/** One live schedule declaration found in the stream (read via `last_by_subj`). */
export interface JobScheduleDeclaration {
  subject: string;
  /** `Nats-Schedule` spec — "@every 30s", cron, "@at …". */
  schedule: string | undefined;
  /** `Nats-Schedule-Target` — the fired republish destination. */
  target: string | undefined;
  seq: number;
}

/**
 * Read the live declaration stored on `scheduleSubject`, or `null` when no
 * message exists (schedule purged / never armed / stream wiped). Uses the
 * JetStream `last_by_subj` direct-get — O(1) per subject.
 */
export async function getJobSchedule(
  scheduleSubject: string,
  stream = "JOBS",
): Promise<JobScheduleDeclaration | null> {
  const jsm = await NatsClient.getJetStreamManager();
  try {
    const sm = await jsm.streams.getMessage(stream, { last_by_subj: scheduleSubject });
    if (sm === null) return null;
    return {
      subject: sm.subject,
      schedule: sm.header?.get(JOB_SCHEDULE_HEADERS.schedule),
      target: sm.header?.get(JOB_SCHEDULE_HEADERS.target),
      seq: sm.seq,
    };
  } catch (error) {
    // 10037 = no message found — the expected "absent" answer.
    if (error instanceof JetStreamApiError && error.apiError().err_code === 10037) return null;
    throw error;
  }
}

/**
 * Enumerate every live `jobs.schedule.*` declaration in the stream.
 * Ephemeral pull consumer + fetch — each rollup subject yields at most one
 * stored message, so subjects dedup naturally. The consumer is deleted
 * afterwards; partial failures surface as an incomplete list, never a throw
 * that hides them (the caller decides whether a short list is fatal).
 */
export async function listJobScheduleSubjects(stream = "JOBS"): Promise<string[]> {
  const jsm = await NatsClient.getJetStreamManager();
  const js = NatsClient.getJetStream();
  const name = `sched-enum-${Date.now()}`;
  await jsm.consumers.add(stream, {
    durable_name: name,
    filter_subjects: ["jobs.schedule.>"],
    ack_policy: AckPolicy.None,
  });
  try {
    const consumer = await js.consumers.get(stream, name);
    const subjects = new Set<string>();
    for (;;) {
      const batch = await consumer.fetch({ max_messages: 200, expires: 1500 });
      let n = 0;
      for await (const m of batch) {
        n++;
        subjects.add(m.subject);
      }
      if (n === 0) break;
    }
    return [...subjects].sort();
  } finally {
    await jsm.consumers.delete(stream, name).catch(() => {});
  }
}

/**
 * Disarm a set of schedules — or ALL live ones with `"all"`. Single purge
 * logic: resolves the subject list then applies `cancelJobSchedule` per
 * subject (the only mechanism — a `jobs.cancel.*` purge publish). Every
 * per-subject failure is collected, not thrown: a disarm pass must run to
 * completion so one bad subject cannot shield the rest. Returns per-subject
 * outcomes for the caller to log/surface.
 */
export async function cancelJobSchedules(
  subjects: string[] | "all",
  stream = "JOBS",
): Promise<{ subject: string; ok: boolean; error?: string }[]> {
  const list = subjects === "all" ? await listJobScheduleSubjects(stream) : subjects;
  const results: { subject: string; ok: boolean; error?: string }[] = [];
  for (const scheduleSubject of list) {
    const rest = scheduleSubject.replace(/^jobs\.schedule\./, "");
    if (rest === scheduleSubject) {
      results.push({ subject: scheduleSubject, ok: false, error: "not a jobs.schedule.* subject" });
      continue;
    }
    try {
      await cancelJobSchedule(scheduleSubject, `jobs.cancel.${rest}`);
      results.push({ subject: scheduleSubject, ok: true });
    } catch (error) {
      results.push({ subject: scheduleSubject, ok: false, error: String(error) });
    }
  }
  return results;
}

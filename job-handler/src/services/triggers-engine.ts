/**
 * triggers-engine — arms/fires dispatches from `job.job_triggers`.
 *
 * A trigger declares an optional event source and/or an optional schedule
 * against a callable target (three execution paths):
 *
 *   event + schedule → event-gated timer: a matching event arms the
 *                      schedule, a non-matching event disarms it
 *                      (fail-closed — the world's state gates the timer)
 *   event only       → immediate dispatch: a matching event publishes the
 *                      forward envelope straight onto the due trampoline
 *                      (no JetStream schedule, nothing to disarm)
 *   schedule only    → pure timer: always armed while enabled (absorbs
 *                      the retired "manual" schedule kind)
 *
 * Lane semantics (`execution_context`):
 *   "user"   → the event publisher's auth headers ride the dispatch
 *              verbatim; an event with no auth material is refused
 *              (fail-closed, never impersonated). Meaningful only with
 *              an event source — schedule-only "user" triggers can never
 *              arm (no message to forward headers from) and are rejected.
 *   "me"     → the trigger author's AuthUser is resolved fresh via
 *              `auth.ctl.resolve_user` and serialized into headers; cached
 *              per live trigger, re-resolved on reload. Resolution failure
 *              (deleted/disabled author, backend down) fails closed.
 *   "system" → no user context at all.
 *
 * "me" and "user" dispatches both travel the USER forward lane — they
 * carry a user identity; the lane split is identity-presence, not origin.
 *
 * Reload tap: trigger CRUD publishes `jobs.ctl.triggers.changed` so a
 * running instance picks up changes without restart. New event subjects
 * still need a process restart (subscriptions are bind-time only).
 */

import {
  NatsClient,
  subscribeShielded,
  forwardAuthHeaders,
  forwardedActor,
  applyPayloadMap,
  serializeAuthUserToHeaders,
  getAuthConfig,
  callNats,
  type PayloadMap,
  type PayloadMapContext,
  type AuthUser,
  logger,
} from "@primebrick/sdk";
import { Filter, field } from "@primebrick/dal-pg";
import { callablePayloadSchema } from "./callable-catalog.js";
import { getDal } from "../db/dal.js";
import { JobTriggerEntity } from "../domain/entities/job_trigger_entity.js";
import { declareSchedule, disarmSchedule, dropScheduleMirror } from "./schedule-service.js";
import { FORWARD_ENVELOPE_MARK, type JobForwardEnvelope } from "./due-forwarder.js";

type RuleFilter = { field: string; op?: string; value?: unknown };
type Lane = "user" | "system";

const AUTH_RESOLVE_USER_SUBJECT = "auth.ctl.resolve_user";

function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function matchFilter(filters: unknown, payload: unknown): boolean {
  if (!Array.isArray(filters) || filters.length === 0) return true;
  return (filters as RuleFilter[]).every((f) => {
    const actual = getPath(payload, f.field);
    switch (f.op ?? "eq") {
      case "eq": return actual === f.value;
      case "neq": return actual !== f.value;
      case "exists": return actual !== undefined && actual !== null;
      case "contains":
        return typeof actual === "string" && typeof f.value === "string" && actual.includes(f.value);
      case "gt": return typeof actual === "number" && typeof f.value === "number" && actual > f.value;
      case "lt": return typeof actual === "number" && typeof f.value === "number" && actual < f.value;
      default: return false;
    }
  });
}

function triggerScheduleSubject(trigger: JobTriggerEntity): string {
  // UUID-keyed — stable across renames: a name change must never orphan
  // the old declaration subject or tombstone the mirror.
  return `jobs.schedule.job.${trigger.uuid}`;
}

function trampolineSubject(lane: Lane, trigger: JobTriggerEntity): string {
  return `jobs.due.${lane}.job.forward.${trigger.uuid}`;
}

/** Live trigger state — the subscription is permanent, the map is the switch. */
const liveTriggers = new Map<string, JobTriggerEntity>(); // uuid → trigger

/**
 * Resolved author identity for "me"-lane headers AND `creator_email` —
 * resolved once per live trigger, dropped on reload. Fire-time freshness
 * beyond this snapshot is the due-forwarder auth checkpoint's job.
 */
const meLaneUsers = new Map<string, AuthUser>(); // uuid → AuthUser
const meLaneHeaders = new Map<string, Record<string, string>>(); // uuid → headers

async function loadTrigger(uuid: string): Promise<JobTriggerEntity | undefined> {
  const rows = (await getDal().findAll<JobTriggerEntity>(JobTriggerEntity, null, {
    filters: [Filter.fieldValue(field(JobTriggerEntity, "uuid"), "=", uuid)],
  })) as JobTriggerEntity[];
  return Array.isArray(rows) ? rows[0] : undefined;
}

/**
 * Resolve the trigger author's current AuthUser — shared by the me-lane
 * forward headers AND the `creator_email` payload-map meta (one
 * `auth.ctl.resolve_user` call per trigger, cached). `created_by` holds
 * the author's internal uuid (auditable convention).
 */
async function resolveCreator(trigger: JobTriggerEntity): Promise<AuthUser | undefined> {
  const cached = meLaneUsers.get(trigger.uuid);
  if (cached) return cached;
  if (!trigger.created_by) return undefined;
  let user: AuthUser | null;
  try {
    user = await callNats<AuthUser | null>(AUTH_RESOLVE_USER_SUBJECT, { user_uuid: trigger.created_by });
  } catch (err) {
    logger.warn(
      `trigger "${trigger.name}": auth.ctl.resolve_user unreachable (${String(err)}) — creator resolution refused`,
      { tags: ["jobs"] },
    );
    return undefined;
  }
  if (!user) {
    logger.warn(
      `trigger "${trigger.name}": author ${trigger.created_by} no longer resolves`,
      { tags: ["jobs"] },
    );
    return undefined;
  }
  meLaneUsers.set(trigger.uuid, user);
  return user;
}

/** Serialize the creator's AuthUser into me-lane forward headers. */
async function resolveMeHeaders(trigger: JobTriggerEntity): Promise<Record<string, string> | undefined> {
  const cached = meLaneHeaders.get(trigger.uuid);
  if (cached) return cached;
  const user = await resolveCreator(trigger);
  if (!user) return undefined;
  const headers = serializeAuthUserToHeaders(user, getAuthConfig());
  meLaneHeaders.set(trigger.uuid, headers);
  return headers;
}

/**
 * Compute the dispatch lane + auth headers for one trigger firing.
 * `msg` is the event message when an event source exists (schedule-only
 * triggers pass undefined). Undefined result = refused (fail-closed).
 */
async function laneAuth(
  trigger: JobTriggerEntity,
  msg?: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] },
): Promise<{ lane: Lane; headers?: Record<string, string> } | undefined> {
  switch (trigger.execution_context) {
    case "system":
      return { lane: "system" };
    case "me": {
      const headers = await resolveMeHeaders(trigger);
      return headers ? { lane: "user", headers } : undefined;
    }
    default: {
      // "user" — requires an event message to forward auth from.
      if (!msg) {
        logger.warn(
          `trigger "${trigger.name}": execution_context "user" requires an event source — dispatch refused`,
          { tags: ["jobs"] },
        );
        return undefined;
      }
      const headers = forwardAuthHeaders(msg);
      if (Object.keys(headers).length === 0) {
        logger.warn(
          `trigger "${trigger.name}": event on ${trigger.event_subject} has no auth headers — user-lane dispatch refused`,
          { tags: ["jobs"] },
        );
        return undefined;
      }
      return { lane: "user", headers };
    }
  }
}

/**
 * Materialize one matched firing: resolve the lane + payload map, then
 * arm the schedule (schedule-bearing triggers) or publish the envelope
 * straight onto the due trampoline (immediate triggers).
 */
async function dispatch(
  trigger: JobTriggerEntity,
  eventPayload: unknown,
  msg?: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] },
): Promise<void> {
  const auth = await laneAuth(trigger, msg);
  if (!auth) return;

  // Payload map resolves against THIS event's snapshot — every schedule
  // fire replays the arm-time mapped request by design. `creator_email`
  // resolves lazily (one cached resolve_user call, shared with the
  // me-lane) only when the map actually references it.
  const actor = msg ? forwardedActor(msg) : {};
  const ctx: PayloadMapContext = {
    actor_uuid: actor.actor_uuid ?? trigger.created_by,
    actor_email: actor.actor_email,
    trigger_id: trigger.uuid,
    fired_at: Date.now(),
    actor_locale: actor.actor_locale,
  };
  const usesCreatorEmail = (v: unknown): boolean =>
    typeof v === "object" && v !== null &&
    (((v as Record<string, unknown>).kind === "meta" && (v as Record<string, unknown>).meta === "creator_email") ||
      Object.values(v as Record<string, unknown>).some(usesCreatorEmail));
  const map = trigger.payload_map as PayloadMap;
  if (map && Object.values(map).some(usesCreatorEmail)) {
    ctx.creator_email = (await resolveCreator(trigger))?.email ?? undefined;
  }
  const mapped = applyPayloadMap(map, eventPayload, ctx, await callablePayloadSchema(trigger.target_subject));

  const envelope: JobForwardEnvelope = {
    [FORWARD_ENVELOPE_MARK]: true,
    target: trigger.target_subject,
    payload: mapped,
    schedule_subject: trigger.schedule_spec ? triggerScheduleSubject(trigger) : undefined,
    initiator: `trigger:${trigger.name}`,
  };

  if (trigger.schedule_spec) {
    // The NATS schedule target MUST live in the JOBS stream capture set —
    // a service-owned callable subject does not. The schedule fires on the
    // JH-internal forward trampoline; the due-forwarder republishes
    // `payload` verbatim to `trigger.target_subject`.
    await declareSchedule({
      schedule_subject: triggerScheduleSubject(trigger),
      schedule: trigger.schedule_spec,
      target: trampolineSubject(auth.lane, trigger),
      kind: "trigger",
      payload: envelope,
      mirror_target: trigger.target_subject,
      forwardHeaders: auth.headers,
      initiator: `trigger:${trigger.name}`,
      trigger_uuid: trigger.uuid,
    });
  } else {
    // Immediate — the envelope lands on the same trampoline the due-
    // forwarder already consumes. jetstreamPublish, not core publish:
    // the trampoline subject is stream-captured — only a PubAck proves
    // the fire was durably stored; a core publish can silently drop.
    await NatsClient.jetstreamPublish(trampolineSubject(auth.lane, trigger), envelope, auth.headers);
  }
}

async function onEvent(triggerUuid: string, payload: unknown, msg: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] }): Promise<void> {
  const trigger = liveTriggers.get(triggerUuid);
  if (!trigger || !trigger.enabled) return;

  if (matchFilter(trigger.filter, payload)) {
    await dispatch(trigger, payload, msg);
  } else if (trigger.schedule_spec) {
    // Event-gated timer: world stopped matching → disarm (fail-closed).
    // A failed disarm leaves the timer firing on a non-matching world —
    // never swallowed: the failure is loud and retryable on the next event.
    await disarmSchedule(triggerScheduleSubject(trigger), `system:trigger:${trigger.name}`).catch((err) => {
      logger.error(
        `trigger "${trigger.name}": gated disarm failed (${String(err)}) — schedule still armed`,
        { tags: ["jobs"] },
      );
    });
  }
}

/** Arm a schedule-only trigger directly (no event gate). */
async function armTimer(trigger: JobTriggerEntity): Promise<void> {
  if (!trigger.schedule_spec || trigger.event_subject) return;
  try {
    await dispatch(trigger, {});
  } catch (err) {
    logger.warn(`trigger "${trigger.name}": schedule-only arm failed (${String(err)})`, { tags: ["jobs"] });
  }
}

export async function refreshTrigger(uuid: string): Promise<void> {
  const trigger = await loadTrigger(uuid);
  const prev = liveTriggers.get(uuid);
  liveTriggers.delete(uuid);
  meLaneHeaders.delete(uuid);
  meLaneUsers.delete(uuid);
  // Any prior timer disarms first — covers disable, delete, and
  // source/schedule shape changes in one step. The failure is loud:
  // a failed disarm leaves a timer firing for a trigger that no longer
  // wants it.
  if (prev?.schedule_spec) {
    const subject = triggerScheduleSubject(prev);
    await disarmSchedule(subject, `system:trigger:${prev.name}`).catch((err) => {
      logger.error(
        `trigger "${prev.name}": refresh disarm failed (${String(err)}) — schedule may still be armed`,
        { tags: ["jobs"] },
      );
    });
    // Trigger deleted → the mirror row goes too: a disarmed tombstone
    // would list a schedule nobody can ever re-arm.
    if (!trigger) {
      await dropScheduleMirror(subject, "system:triggers-engine").catch((err) => {
        logger.warn(`trigger "${prev.name}": mirror row drop failed (${String(err)})`, { tags: ["jobs"] });
      });
    }
  }
  if (!trigger || !trigger.enabled) return;
  liveTriggers.set(uuid, trigger);
  if (!trigger.event_subject && trigger.schedule_spec) await armTimer(trigger);
}

export async function startTriggersEngine(): Promise<void> {
  const dal = getDal();
  const triggers = (await dal.findAll<JobTriggerEntity>(JobTriggerEntity, null, {
    filters: [Filter.fieldValue(field(JobTriggerEntity, "enabled"), "=", true)],
  })) as JobTriggerEntity[];

  // One shielded subscription per event subject (dedup) — the handler
  // fans out to every live trigger bound to that subject.
  const bySubject = new Map<string, string[]>();
  for (const trigger of Array.isArray(triggers) ? triggers : []) {
    liveTriggers.set(trigger.uuid, trigger);
    if (trigger.event_subject) {
      const list = bySubject.get(trigger.event_subject) ?? [];
      list.push(trigger.uuid);
      bySubject.set(trigger.event_subject, list);
    }
  }
  for (const [subject, uuids] of bySubject) {
    // Queue "job" — WORK subject: when multiple JH replicas run, NATS
    // delivers each event to exactly ONE member (verified empirically:
    // queued subscribers split deliveries; unqueued ones all receive a
    // copy — that would double-dispatch every matching trigger).
    // `jobs.ctl.triggers.changed` below stays unqueued on purpose: the
    // reload is a broadcast every replica must see to keep liveTriggers
    // consistent.
    await subscribeShielded(subject, (payload, msg) =>
      Promise.all(uuids.map((id) => onEvent(id, payload, msg))).then(() => {}),
      { queue: "job" },
    );
    logger.done(`trigger subscription bound on ${subject} (${uuids.length} trigger(s), queue=job)`, { tags: ["jobs"] });
  }

  // Schedule-only triggers arm at boot — there is no event to gate them.
  for (const trigger of liveTriggers.values()) {
    if (!trigger.event_subject && trigger.schedule_spec) await armTimer(trigger);
  }

  // Reload tap: trigger CRUD publishes here so a running instance picks up
  // changes without restart. Core pub/sub — `jobs.ctl.*` is the control
  // plane, never stream-captured; a missed event self-heals on restart.
  await subscribeShielded<{ trigger_uuid?: string }>(
    "jobs.ctl.triggers.changed",
    async (data) => {
      if (data?.trigger_uuid) await refreshTrigger(data.trigger_uuid);
    },
  );

  logger.done(`triggers-engine: ${liveTriggers.size} trigger(s) on ${bySubject.size} subject(s)`, { tags: ["jobs"] });
}

/**
 * rules-engine — arms/disarms schedules from `job.job_rules`.
 *
 * A rule binds an event subject → filter → schedule. At boot (and after
 * rule CRUD, via the `jobs.ctl.rules.changed` reload tap) each enabled
 * rule gets a shielded subscription on its event subject:
 *
 *   event matches filter  → declareSchedule (kind "rule")
 *   event stops matching  → disarmSchedule (fail-closed)
 *
 * Lane semantics: `execution_context = 'user'` forwards the publisher's
 * auth headers into the schedule verbatim — if the event carries no
 * auth material, the arm is refused (fail-closed, never minted).
 */

import {
  NatsClient,
  subscribeShielded,
  forwardAuthHeaders,
  dueLaneVerify,
  logger,
} from "@primebrick/sdk";
import { Filter, field } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import { JobRuleEntity } from "../domain/entities/job_rule_entity.js";
import { declareSchedule, disarmSchedule } from "./schedule-service.js";
import { JOBS_STREAM } from "./run-recorder.js";

type RuleFilter = { field: string; op?: string; value?: unknown };

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

function ruleScheduleSubject(rule: JobRuleEntity): string {
  return `jobs.schedule.job.${rule.name.replace(/[^a-z0-9-]+/g, "-")}`;
}

/** Live rule state — the subscription is permanent, the map is the switch. */
const liveRules = new Map<string, JobRuleEntity>(); // uuid → rule

async function loadRule(uuid: string): Promise<JobRuleEntity | undefined> {
  const rows = (await getDal().findAll<JobRuleEntity>(JobRuleEntity, null, {
    filters: [Filter.fieldValue(field(JobRuleEntity, "uuid"), "=", uuid)],
  })) as JobRuleEntity[];
  return Array.isArray(rows) ? rows[0] : undefined;
}

async function refreshRule(uuid: string): Promise<void> {
  const rule = await loadRule(uuid);
  const prev = liveRules.get(uuid);
  if (!rule || !rule.enabled) {
    liveRules.delete(uuid);
    if (prev) {
      await disarmSchedule(ruleScheduleSubject(prev), `system:rule:${prev.name}`).catch(() => {});
    }
    return;
  }
  liveRules.set(uuid, rule);
}

async function onEvent(ruleUuid: string, payload: unknown, msg: { headers?: Parameters<typeof forwardAuthHeaders>[0]["headers"] }): Promise<void> {
  const rule = liveRules.get(ruleUuid);
  if (!rule || !rule.enabled) return;
  const scheduleSubject = ruleScheduleSubject(rule);

  if (matchFilter(rule.filter, payload)) {
    // user lane: the event MUST carry the caller's auth material —
    // no headers → refuse to arm (fail closed), never impersonate.
    const fwd = rule.execution_context === "user" ? forwardAuthHeaders(msg) : undefined;
    if (rule.execution_context === "user" && (!fwd || Object.keys(fwd).length === 0)) {
      logger.warn(
        `rule "${rule.name}": event on ${rule.event_subject} has no auth headers — user-lane schedule NOT armed`,
        { tags: ["jobs"] },
      );
      return;
    }
    await declareSchedule({
      schedule_subject: scheduleSubject,
      schedule: rule.schedule_spec,
      target: rule.target_subject,
      kind: "rule",
      payload,
      source: rule.source_subject ?? undefined,
      forwardHeaders: fwd,
      initiator: `rule:${rule.name}`,
      rule_uuid: rule.uuid,
    });
  } else {
    await disarmSchedule(scheduleSubject, `system:rule:${rule.name}`).catch(() => {});
  }
}

export async function startRulesEngine(): Promise<void> {
  const dal = getDal();
  const rules = (await dal.findAll<JobRuleEntity>(JobRuleEntity, null, {
    filters: [Filter.fieldValue(field(JobRuleEntity, "enabled"), "=", true)],
  })) as JobRuleEntity[];

  // One shielded subscription per event subject (dedup) — the handler
  // fans out to every live rule bound to that subject.
  const bySubject = new Map<string, string[]>();
  for (const rule of Array.isArray(rules) ? rules : []) {
    liveRules.set(rule.uuid, rule);
    const list = bySubject.get(rule.event_subject) ?? [];
    list.push(rule.uuid);
    bySubject.set(rule.event_subject, list);
  }
  for (const [subject, uuids] of bySubject) {
    await subscribeShielded(subject, (payload, msg) =>
      Promise.all(uuids.map((id) => onEvent(id, payload, msg))).then(() => {}),
    );
    logger.done(`rule subscription bound on ${subject} (${uuids.length} rule(s))`, { tags: ["jobs"] });
  }

  // Reload tap: rule CRUD publishes here so a running instance picks up
  // changes without restart. New event subjects need a process restart —
  // documented limitation of v1 (subscriptions are bind-time only).
  await NatsClient.jetstreamSubscribe<{ rule_uuid?: string }>({
    stream: JOBS_STREAM,
    durable: "job-rules-reloader",
    filterSubject: "jobs.ctl.rules.changed",
    verify: dueLaneVerify("system"),
    handler: async (data) => {
      if (data.rule_uuid) await refreshRule(data.rule_uuid);
    },
  });

  logger.done(`rules-engine: ${liveRules.size} rule(s) on ${bySubject.size} subject(s)`, { tags: ["jobs"] });
}

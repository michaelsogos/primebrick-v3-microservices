/**
 * schedule-service — the ONLY writer of `jobs.schedule.*` declarations.
 *
 * Every arm/disarm flows through here: the `jobs.ctl.schedule.request`
 * route (services self-declaring infra jobs), the rules engine (rule-
 * materialized schedules), and the admin HTTP action (manual jobs).
 *
 * Invariants enforced:
 *   - schedule_subject is `jobs.schedule.<owner>.<name>[.<id>]`
 *   - target is `jobs.due.<lane>.<owner>.<action>[.<id>]` — the lane is
 *     derived from the target prefix, never trusted from input
 *   - for route-declared schedules, <owner> MUST equal the caller's
 *     service code (parsed from its UA) — a service can only arm its own
 *     namespace; rule/manual schedules are declared by primebrick-job
 *     itself (owner "job" or the target service for rule lanes)
 *   - every arm/disarm is mirrored in job.job_schedules (observability)
 */

import {
  ensureJobSchedule,
  cancelJobSchedule,
  logger,
} from "@primebrick/sdk";
import { Filter, field, toUUID } from "@primebrick/dal-pg";
import { getDal } from "../db/dal.js";
import { JobScheduleEntity } from "../domain/entities/job_schedule_entity.js";

export interface DeclareScheduleInput {
  schedule_subject: string;
  schedule: string;
  target: string;
  kind: "infra_derived" | "rule" | "manual";
  /** Caller's verified service code — undefined for internal (rules engine). */
  caller_service?: string;
  payload?: unknown;
  source?: string;
  ttl?: string;
  forwardHeaders?: Record<string, string>;
  initiator?: string;
  rule_uuid?: string;
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

export async function declareSchedule(input: DeclareScheduleInput): Promise<{ seq: bigint }> {
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
  // Internal callers (rules engine, admin action) own the "job" namespace
  // and MAY target any service's due subject — that's the point of rules.

  const seq = await ensureJobSchedule({
    scheduleSubject: input.schedule_subject,
    schedule: input.schedule,
    target: input.target,
    payload: input.payload,
    source: input.source,
    ttl: input.ttl,
    forwardHeaders: input.forwardHeaders,
  });

  // Mirror in job_schedules — upsert on the unique schedule_subject.
  const dal = getDal();
  const existing = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", input.schedule_subject)],
  });
  const row: Partial<JobScheduleEntity> = {
    schedule_subject: input.schedule_subject,
    service_code: owner,
    job_name: sm[2]!,
    kind: input.kind,
    lane,
    schedule_spec: input.schedule,
    schedule_type: input.schedule.startsWith("@at") ? "once" : "recurring",
    target_subject: input.target,
    status: "armed",
    initiator: input.initiator ?? input.caller_service ?? "job",
    rule_uuid: input.rule_uuid === undefined ? undefined : toUUID(input.rule_uuid),
    armed_at: new Date(),
    disarmed_at: undefined,
  };
  const actor = input.caller_service ?? input.initiator ?? "system:primebrick-job";
  if (Array.isArray(existing) && existing.length > 0) {
    await dal.update(
      JobScheduleEntity,
      { ...row, uuid: existing[0]!.uuid, version: existing[0]!.version } as never,
      { actor, matchBy: "uuid" } as never,
    );
  } else {
    await dal.add(JobScheduleEntity, row as never, { actor } as never);
  }

  logger.done(
    `schedule armed: ${input.schedule_subject} → ${input.target} (${input.schedule})`,
    { tags: ["jobs"] },
  );
  return { seq };
}

/** Disarm — JetStream cancel + registry status flip. */
export async function disarmSchedule(
  scheduleSubject: string,
  actor: string,
): Promise<void> {
  const rest = scheduleSubject.replace(/^jobs\.schedule\./, "");
  if (rest === scheduleSubject) {
    throw new ScheduleDeclarationError("INVALID_SCHEDULE_SUBJECT", `not a jobs.schedule.* subject: ${scheduleSubject}`);
  }
  await cancelJobSchedule(scheduleSubject, `jobs.cancel.${rest}`);

  const dal = getDal();
  const rows = await dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
    filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject)],
  });
  if (Array.isArray(rows) && rows.length > 0) {
    await dal.update(
      JobScheduleEntity,
      {
        uuid: rows[0]!.uuid,
        status: "disarmed",
        disarmed_at: new Date(),
        version: rows[0]!.version,
      } as never,
      { actor, matchBy: "uuid" } as never,
    );
  }
  logger.done(`schedule disarmed: ${scheduleSubject}`, { tags: ["jobs"] });
}

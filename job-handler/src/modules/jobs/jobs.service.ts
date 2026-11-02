/**
 * Entity-service facades over `makeEntityService` — thin, transport-free.
 * The NATS publish on job_trigger writes lets a running instance reload its
 * triggers engine without restart.
 */

import { type EntityService, ValidationError } from "@primebrick/dal-pg";
import { NatsClient, makeMarkerAuditPort, payloadMapConformance } from "@primebrick/sdk";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";
import { JobTriggerEntity } from "../../domain/entities/job_trigger_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { callableSubjects, callablePayloadSchema } from "../../services/callable-catalog.js";

const TRIGGER_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };
const RUN_FILTERABLE = new Set(["status", "service_code", "job_name", "lane", "schedule_subject", "created_at", "updated_at"]);
const TRIGGER_FILTERABLE = new Set(["name", "event_subject", "target_subject", "execution_context", "enabled"]);
const SCHEDULE_FILTERABLE = new Set(["service_code", "job_name", "kind", "lane", "status", "schedule_type", "schedule_subject"]);

function publishTriggerChanged(uuid: unknown): void {
  if (typeof uuid !== "string") return;
  NatsClient.jetstreamPublish("jobs.ctl.triggers.changed", { trigger_uuid: uuid }).catch(() => {});
}

/**
 * `target_subject` must be a declared callable — the same census.callables
 * list the form's combo renders. Writes the form could not produce
 * (hand-crafted API payloads, stale clients) are rejected here: a target
 * nobody serves is a silent dead letter at fire time.
 */
async function assertCallableTarget(body: Record<string, unknown>): Promise<void> {
  const target = body["target_subject"];
  if (typeof target !== "string" || target.length === 0) return; // NOT NULL violations surface as column errors
  const subjects = await callableSubjects();
  if (!subjects.has(target)) {
    throw new ValidationError(
      `target_subject "${target}" is not a declared callable — pick a subject from census.callables`,
    );
  }
}

/**
 * Trigger shape contract: `event_subject` and `schedule_spec` are mutually
 * mandatory (at least one); `execution_context "user"` needs an event to
 * forward auth headers from — schedule-only triggers must use "me" or
 * "system". Partial-update bodies (PATCH) may omit a field entirely, so
 * only fields PRESENT in the body constrain the outcome.
 */
export function assertTriggerShape(body: Record<string, unknown>, isCreate: boolean): void {
  const eventOk = typeof body.event_subject === "string" && body.event_subject.length > 0;
  const scheduleOk = typeof body.schedule_spec === "string" && body.schedule_spec.length > 0;
  if (isCreate && !eventOk && !scheduleOk) {
    throw new ValidationError(
      `a trigger needs at least one of event_subject or schedule_spec`,
    );
  }
  const eventCleared = "event_subject" in body && !eventOk;
  const scheduleCleared = "schedule_spec" in body && !scheduleOk;
  if (eventCleared && scheduleCleared) {
    throw new ValidationError(
      `a trigger needs at least one of event_subject or schedule_spec — clearing both is not allowed`,
    );
  }
  if (body.execution_context === "user" && (eventCleared || (isCreate && !eventOk))) {
    throw new ValidationError(
      `execution_context "user" requires an event source — use "me" or "system" for schedule-only triggers`,
    );
  }
}

function isEmptyMap(map: unknown): boolean {
  return (
    map === undefined ||
    map === null ||
    (typeof map === "object" && !Array.isArray(map) && Object.keys(map as object).length === 0)
  );
}

/**
 * `payload_map` must conform to the selected callable's emitted
 * `payload_schema`: required destination fields must be covered (an entry,
 * or an `x_inject`/`x_semantic` annotation on the schema prop), and every
 * `const` value must satisfy the prop's portable JSON-Schema constraints.
 * An absent/empty map is verbatim passthrough — fire-time data may carry
 * the requireds, so nothing is checked. Runs after `assertCallableTarget`
 * so the subject is a known catalog entry; a schema-less callable yields
 * no contract and nothing to check against.
 */
export async function assertPayloadMapConformance(
  body: Record<string, unknown>,
  loadExisting?: () => Promise<Record<string, unknown> | undefined>,
): Promise<void> {
  const mapPresent = "payload_map" in body;
  const targetPresent = "target_subject" in body;
  if (!mapPresent && !targetPresent) return;
  const existing = (!mapPresent || !targetPresent) && loadExisting ? await loadExisting() : undefined;
  const subject =
    (typeof body.target_subject === "string" && body.target_subject) ||
    (typeof existing?.["target_subject"] === "string" ? (existing["target_subject"] as string) : "");
  if (!subject) return; // absent target surfaces as a column error elsewhere
  const map = mapPresent ? body["payload_map"] : existing?.["payload_map"];
  if (isEmptyMap(map)) return; // verbatim passthrough — nothing mappable to check
  const schema = await callablePayloadSchema(subject);
  if (!schema) return;
  const issues = payloadMapConformance(map as Record<string, unknown>, schema);
  if (issues.length > 0) {
    throw new ValidationError(
      `payload_map does not conform to ${subject} — ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
    );
  }
}

export class JobTriggersService {
  private svc = getDal().entityService<JobTriggerEntity & Record<string, unknown>>({
    entity: JobTriggerEntity,
    actor: entityActor,
    // Collaboration: audit write + entity-changed marker on NATS — the
    // gateway persists markers to Redis (services own no Redis client).
    auditPort: makeMarkerAuditPort(getDal().tableAuditPort(), "job_trigger"),
    list: {
      searchableKeys: new Set(["name", "event_subject", "target_subject"]),
      filterableKeys: TRIGGER_FILTERABLE,
      defaultSort: TRIGGER_DEFAULT_SORT,
    },
    hooks: {
      beforeCreate: async (body: Record<string, unknown>) => {
        assertTriggerShape(body, true);
        await assertCallableTarget(body);
        await assertPayloadMapConformance(body);
        return body;
      },
      beforeUpdate: async (uuid: string, body: Record<string, unknown>) => {
        assertTriggerShape(body, false);
        await assertCallableTarget(body);
        await assertPayloadMapConformance(body, async () => {
          const row = await this.svc.get(uuid);
          return row as Record<string, unknown> | undefined;
        });
        return body;
      },
      afterWrite: async (_op: string, row: Record<string, unknown>) => { publishTriggerChanged(row.uuid as string); },
    },
  } as never);

  get list() { return this.svc.list.bind(this.svc); }
  get get() { return this.svc.get.bind(this.svc); }
  get create() { return this.svc.create.bind(this.svc); }
  get update() { return this.svc.update.bind(this.svc); }
  get delete() { return this.svc.delete.bind(this.svc); }
  get restore() { return this.svc.restore.bind(this.svc); }
  get audit() { return this.svc.audit.bind(this.svc); }
}

export class JobSchedulesService {
  private svc = getDal().entityService<JobScheduleEntity & Record<string, unknown>>({
    entity: JobScheduleEntity,
    actor: entityActor,
    auditPort: makeMarkerAuditPort(getDal().tableAuditPort(), "job_schedule"),
    list: {
      searchableKeys: new Set(["schedule_subject", "job_name", "service_code"]),
      filterableKeys: SCHEDULE_FILTERABLE,
      defaultSort: TRIGGER_DEFAULT_SORT,
    },
  } as never);

  get list() { return this.svc.list.bind(this.svc); }
  get get() { return this.svc.get.bind(this.svc); }
  get create() { return this.svc.create.bind(this.svc); }
  get update() { return this.svc.update.bind(this.svc); }
  get delete() { return this.svc.delete.bind(this.svc); }
  get restore() { return this.svc.restore.bind(this.svc); }
  get audit() { return this.svc.audit.bind(this.svc); }
}

export class JobRunsService {
  private svc = getDal().entityService<JobRunEntity & Record<string, unknown>>({
    entity: JobRunEntity,
    actor: entityActor,
    auditPort: makeMarkerAuditPort(getDal().tableAuditPort(), "job_run"),
    list: {
      searchableKeys: new Set(["job_name", "service_code", "error_code"]),
      filterableKeys: RUN_FILTERABLE,
      defaultSort: TRIGGER_DEFAULT_SORT,
    },
  } as never);

  get list() { return this.svc.list.bind(this.svc); }
  get get() { return this.svc.get.bind(this.svc); }
  get create() { return this.svc.create.bind(this.svc); }
  get update() { return this.svc.update.bind(this.svc); }
  get delete() { return this.svc.delete.bind(this.svc); }
  get restore() { return this.svc.restore.bind(this.svc); }
  get audit() { return this.svc.audit.bind(this.svc); }
}

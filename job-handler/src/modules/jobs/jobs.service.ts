/**
 * Entity domain services on `DomainService` — transport-free, consumed by
 * the entity router. The NATS publish on job_trigger writes lets a running
 * instance reload its triggers engine without restart.
 */

import { DomainService, ValidationError, type EntityServiceConfig } from "@primebrick/dal-pg";
import { NatsClient, makeMarkerAuditPort, payloadMapConformance, jobTriggerShapeIssues, logger } from "@primebrick/sdk";
import { entityActor } from "../../db/entity-repo.js";
import { JobTriggerEntity } from "../../domain/entities/job_trigger_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { callableSubjects, callablePayloadSchema, emitPayloadSchema } from "../../services/callable-catalog.js";
import { listJobScheduleSubjects } from "../../nats/schedule-mechanism.js";
import { scheduleDrift } from "../../services/schedule-service.js";
import { Filter } from "@primebrick/dal-pg";

const TRIGGER_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };
const RUN_FILTERABLE = new Set(["status", "service_code", "job_name", "run_as", "schedule_subject", "created_at", "updated_at"]);
const TRIGGER_FILTERABLE = new Set(["name", "event_subject", "target_subject", "run_as", "runs", "last_run", "next_run"]);
const SCHEDULE_FILTERABLE = new Set(["service_code", "kind", "run_as", "status", "schedule_type", "schedule_subject", "armed_by"]);

function publishTriggerChanged(uuid: unknown): void {
  if (typeof uuid !== "string") return;
  // Core pub/sub, not JetStream: `jobs.ctl.*` is the control plane and must
  // stay OUTSIDE the stream capture set (a stored subject would swallow
  // req/reply AND any syncSubjects re-ensure by another service strips it —
  // the publish then fails silently and the reload tap dies). A missed
  // event is harmless: boot reloads every enabled trigger anyway.
  NatsClient.publish("jobs.ctl.triggers.changed", { trigger_uuid: uuid }).catch((err) => {
    logger.warn(`trigger changed publish failed (${String(err)})`, { tags: ["jobs"] });
  });
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
 * Trigger shape contract — delegates to the SAME core predicate the
 * superform applies (`job_trigger_shape` in the closed validator
 * registry): one rule, two surfaces, zero drift. The rule covers
 * event-or-schedule presence, `run_as "originator"` needing an
 * event, and a one-shot `@at` lying in the past (server clock injected).
 * PATCH bodies carry only the changed fields, so the predicate runs on
 * the MERGED record — the shape contract always sees the whole entity.
 */
export async function assertTriggerShape(
  body: Record<string, unknown>,
  isCreate: boolean,
  loadExisting?: () => Promise<Record<string, unknown> | undefined>,
): Promise<void> {
  const existing = !isCreate && loadExisting ? await loadExisting() : undefined;
  const entity = isCreate ? body : { ...existing, ...body };
  const issues = jobTriggerShapeIssues(entity);
  if (issues.length > 0) {
    throw new ValidationError(
      issues.map((i) => `${i.path}: ${i.message}`).join("; "),
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
  const eventSubject =
    (typeof body.event_subject === "string" && body.event_subject) ||
    (typeof existing?.["event_subject"] === "string" ? (existing["event_subject"] as string) : "");
  const sourceSchema = eventSubject ? await emitPayloadSchema(eventSubject) : undefined;
  const issues = payloadMapConformance(map as Record<string, unknown>, schema, sourceSchema);
  if (issues.length > 0) {
    throw new ValidationError(
      `payload_map does not conform to ${subject} — ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
    );
  }
}

type TriggerT = JobTriggerEntity & Record<string, unknown>;
type ScheduleT = JobScheduleEntity & Record<string, unknown>;
type RunT = JobRunEntity & Record<string, unknown>;

export class JobTriggersService extends DomainService<TriggerT> {
  constructor() {
    super({
      entity: JobTriggerEntity,
      actor: entityActor,
      list: {
        searchableKeys: ["name", "event_subject", "target_subject"],
        filterableKeys: TRIGGER_FILTERABLE,
        defaultSort: TRIGGER_DEFAULT_SORT,
      },
    });
  }

  // `runs`/`last_run`/`next_run` are @Calculated projections on
  // JobTriggerEntity — the DAL emits them inside the list/get SQL itself
  // (sortable + filterable like physical columns). No post-query
  // decoration remains on this service.

  /** Config enrichment needing `this.dal` (marker audit port) and hooks
   *  reading through the resolved `this.svc` — both only safe here, not
   *  inside `super()`. */
  protected override buildConfig(): EntityServiceConfig<TriggerT> {
    return {
      ...super.buildConfig(),
      // Collaboration: audit write + entity-changed marker on NATS — the
      // gateway persists markers to Redis (services own no Redis client).
      auditPort: makeMarkerAuditPort(this.dal.tableAuditPort(), "job_trigger"),
      hooks: {
        beforeCreate: async (body: Record<string, unknown>) => {
          await assertTriggerShape(body, true);
          await assertCallableTarget(body);
          await assertPayloadMapConformance(body);
          return body;
        },
        beforeUpdate: async (uuid: string, body: Record<string, unknown>) => {
          const loadExisting = async () => {
            const row = await this.svc.get(uuid);
            return row as Record<string, unknown> | undefined;
          };
          await assertTriggerShape(body, false, loadExisting);
          await assertCallableTarget(body);
          await assertPayloadMapConformance(body, loadExisting);
          return body;
        },
        afterWrite: async (_op: string, row: Record<string, unknown>) => { publishTriggerChanged(row.uuid as string); },
      },
    };
  }
}

/**
 * Read-only service over the `job_schedules` mirror — schedule state is
 * written ONLY by `schedule-service.ts` (declare/disarm), never through
 * entity CRUD. The entity route exposes list/get/audit only.
 *
 * Every row is decorated with `live` (the declaration exists on NATS —
 * the scheduler's truth) and `drift` (`stale` = mirror says terminal but
 * NATS still fires; `missing` = mirror says armed but nothing is
 * scheduled). The mirror never impersonates reality: an admin always
 * sees BOTH states.
 */
export class JobSchedulesService extends DomainService<ScheduleT> {
  constructor() {
    super({
      entity: JobScheduleEntity,
      actor: entityActor,
      list: {
        searchableKeys: ["schedule_subject", "job_name", "service_code"],
        filterableKeys: SCHEDULE_FILTERABLE,
        defaultSort: TRIGGER_DEFAULT_SORT,
      },
    });
  }

  protected override buildConfig(): EntityServiceConfig<ScheduleT> {
    return {
      ...super.buildConfig(),
      auditPort: makeMarkerAuditPort(this.dal.tableAuditPort(), "job_schedule"),
    };
  }

  /** Decorate rows with live/drift — ONE enumeration per call. */
  private async decorate(rows: (JobScheduleEntity & Record<string, unknown>)[]): Promise<void> {
    const liveSubjects = await listJobScheduleSubjects().catch(() => undefined);
    for (const row of rows) {
      const d = scheduleDrift(row, liveSubjects === undefined ? undefined : liveSubjects.includes(row.schedule_subject));
      row.live = d.live;
      row.drift = d.drift;
    }
  }

  override async list(query: Parameters<DomainService<ScheduleT>["list"]>[0]) {
    const result = await super.list(query);
    await this.decorate(result.rows as (JobScheduleEntity & Record<string, unknown>)[]);
    return result;
  }

  override async get(uuid: string) {
    const row = await super.get(uuid);
    await this.decorate([row as JobScheduleEntity & Record<string, unknown>]);
    return row;
  }

  /** Mirror rows for a set of subjects — the spec/arm-window facts the
   *  run-stats expected-fire enumeration reads (no live/drift decoration:
   *  this read feeds arithmetic, not the list surface). */
  async listRowsBySubjects(scheduleSubjects: string[]): Promise<JobScheduleEntity[]> {
    const rows = await this.dal.findAll<JobScheduleEntity>(JobScheduleEntity, null, {
      filters: [
        Filter.expr(
          { sql: "schedule_subject" },
          "=",
          { sql: "ANY(?)", params: [scheduleSubjects] },
        ),
      ],
    });
    return Array.isArray(rows) ? (rows as JobScheduleEntity[]) : [];
  }
}

export class JobRunsService extends DomainService<RunT> {
  constructor() {
    super({
      entity: JobRunEntity,
      actor: entityActor,
      list: {
        searchableKeys: ["job_name", "service_code", "error_code"],
        filterableKeys: RUN_FILTERABLE,
        defaultSort: TRIGGER_DEFAULT_SORT,
      },
    });
  }

  protected override buildConfig(): EntityServiceConfig<RunT> {
    return {
      ...super.buildConfig(),
      auditPort: makeMarkerAuditPort(this.dal.tableAuditPort(), "job_run"),
    };
  }
}

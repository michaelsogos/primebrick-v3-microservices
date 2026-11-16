/**
 * Entity domain services on `DomainService` — transport-free, consumed by
 * the entity router. The NATS publish on job_trigger writes lets a running
 * instance reload its triggers engine without restart.
 */

import { DomainService, ValidationError, type EntityServiceConfig } from "@primebrick/dal-pg";
import { NatsClient, makeMarkerAuditPort, payloadMapConformance, payloadPassthroughConformance, jobTriggerShapeIssues, logger } from "@primebrick/sdk";
import { entityActor } from "../../db/entity-repo.js";
import { JobTriggerEntity } from "../../domain/entities/job_trigger_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { callableSubjects, callablePayloadSchema, emitSubjects, emitDeclFor, subjectCoveredBy } from "../../services/callable-catalog.js";
import { resolveMapKeySchemas } from "../../services/map-key-schemas.js";
import { listJobScheduleSubjects } from "../../nats/schedule-mechanism.js";
import { scheduleDrift } from "../../services/schedule-service.js";
import { jobTriggerMeta, jobScheduleMeta, jobRunMeta } from "./job.meta.js";
import { Filter } from "@primebrick/dal-pg";

const TRIGGER_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

export function publishTriggerChanged(uuid: unknown): void {
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
 * `event_subject` must resolve to a declared emit — the `census.events`
 * vocabulary the form's combo offers. Wildcard emits cover the concrete
 * subjects their pattern spans. A trigger bound to a subject nobody emits
 * is a dead subscription — it can never fire, and the write hides it.
 * Body-only check mirroring `assertCallableTarget`: the subject is
 * re-proven whenever the write carries it.
 */
export async function assertEmitSubject(body: Record<string, unknown>): Promise<void> {
  const event = body["event_subject"];
  if (typeof event !== "string" || event.length === 0) return; // NOT NULL/shape violations surface elsewhere
  const subjects = await emitSubjects();
  if (subjects.has(event)) return;
  for (const pattern of subjects) {
    if (subjectCoveredBy(pattern, event)) return;
  }
  throw new ValidationError(
    `event_subject "${event}" is not a declared emit — pick a subject from census.emits`,
  );
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
 *
 * An absent/empty map is verbatim passthrough — `applyPayloadMap` returns
 * the event payload unchanged (a schedule-only fire dispatches `{}`).
 * Required destination props must then be deliverable through the
 * passthrough itself: `x_inject`/`x_semantic` props materialize at fire
 * time; anything else must be provably present in the source emit's
 * declared schema (required AND path-compatible). Schedule-only carries
 * no source data at all, so uncovered requireds are undeliverable — the
 * write is a guaranteed `parse` failure at fire time. A schema-less emit
 * fails open per field (nothing declared to check against).
 *
 * `x_map_keys` declarations (e.g. `variables` keyed by the const
 * `templateCode` pick) resolve through the owning service's public entity
 * API via `resolveMapKeySchemas` — the same catalog rows the form's
 * editor reads, through the governed internal client. Resolution failure
 * fails open; the base map check still stands.
 *
 * Runs after `assertCallableTarget`/`assertEmitSubject` so both subjects
 * are known catalog entries; a schema-less callable yields no contract
 * and nothing to check against.
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
  const schema = await callablePayloadSchema(subject);
  if (!schema) return;
  const eventSubject =
    (typeof body.event_subject === "string" && body.event_subject) ||
    (typeof existing?.["event_subject"] === "string" ? (existing["event_subject"] as string) : "");
  const emit = eventSubject ? await emitDeclFor(eventSubject) : undefined;
  if (isEmptyMap(map)) {
    const issues = payloadPassthroughConformance(schema, eventSubject ? emit?.schema : null);
    if (issues.length > 0) {
      throw new ValidationError(
        `payload_map does not conform to ${subject} — ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      );
    }
    return;
  }
  const mapKeySchemas = await resolveMapKeySchemas(schema, map as Record<string, unknown>);
  const issues = payloadMapConformance(map as Record<string, unknown>, schema, emit?.schema, mapKeySchemas);
  if (issues.length > 0) {
    throw new ValidationError(
      `payload_map does not conform to ${subject} — ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
    );
  }
}

/**
 * Code-owned interchange fields on a system trigger (`system_key` set) —
 * source, destination, execution identity, payload shaping, event gate.
 * This is the SAME frozen set the form's `depends_on.set` gate renders
 * disabled; the wire is the fail-closed mirror — API writes never see
 * the FE. `schedule_spec`/`name` stay user-owned: that is the point of
 * the model (the user governs cadence and display, the code owns the
 * inter-service contract).
 */
const SYSTEM_TRIGGER_FROZEN_FIELDS = ["event_subject", "target_subject", "run_as", "payload_map", "filter"] as const;

/** Re-exported for the materialize reconcile — the SAME structural
 *  compare decides both "user tried to change it" (wire rule) and
 *  "declaration drifted from the row" (reconcile). */
export { canonJson } from "../../utils/canon-json.js";
import { canonJson } from "../../utils/canon-json.js";

/**
 * The system-trigger frozen-set rule — wire side.
 * - CREATE: `system_key` in the body is rejected outright — system rows
 *   are born ONLY from module materialization, never claimed via API.
 * - UPDATE: `system_key` itself may never change (a user row cannot turn
 *   system, a system row cannot shed or swap its identity); on a system
 *   row, a frozen field whose value DIFFERS from the stored one is
 *   rejected — a verbatim echo of the stored value is not a mutation.
 * Materialization reconciles through its own path, not this hook.
 */
export function assertSystemTriggerMutable(
  body: Record<string, unknown>,
  isCreate: boolean,
  existing?: Record<string, unknown>,
): void {
  const KEY = "app.common.validation.system_trigger_immutable";
  if (isCreate) {
    if (body["system_key"] !== undefined && body["system_key"] !== null) {
      throw new ValidationError(`system_key: ${KEY}`);
    }
    return;
  }
  if ("system_key" in body && canonJson(body["system_key"]) !== canonJson(existing?.["system_key"])) {
    throw new ValidationError(`system_key: ${KEY}`);
  }
  if (existing?.["system_key"] == null) return; // user-made row — nothing is frozen
  const violated = SYSTEM_TRIGGER_FROZEN_FIELDS.filter(
    (f) => f in body && canonJson(body[f]) !== canonJson(existing[f]),
  );
  if (violated.length > 0) {
    throw new ValidationError(
      violated.map((f) => `${f}: ${KEY}`).join("; "),
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
        meta: jobTriggerMeta,
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
          assertSystemTriggerMutable(body, true);
          await assertTriggerShape(body, true);
          await assertCallableTarget(body);
          await assertEmitSubject(body);
          await assertPayloadMapConformance(body);
          return body;
        },
        beforeUpdate: async (uuid: string, body: Record<string, unknown>) => {
          const loadExisting = async () => {
            const row = await this.svc.get(uuid);
            return row as Record<string, unknown> | undefined;
          };
          assertSystemTriggerMutable(body, false, await loadExisting());
          await assertTriggerShape(body, false, loadExisting);
          await assertCallableTarget(body);
          await assertEmitSubject(body);
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
        meta: jobScheduleMeta,
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
        meta: jobRunMeta,
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

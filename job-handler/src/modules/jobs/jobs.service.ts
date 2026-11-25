/**
 * Entity domain services on `DomainService` — transport-free, consumed by
 * the entity router. The NATS publish on job_trigger writes lets a running
 * instance reload its triggers engine without restart.
 */

import { DomainService, ValidationError, field, Filter, GroupBy, makeTableAuditPort, Project, Sort, type EntityServiceConfig } from "@primebrick/dal-pg";
import { NatsClient, assertWritableConfigKey, makeMarkerAuditPort, payloadMapConformance, payloadPassthroughConformance, jobTriggerShapeIssues, logger, requireActor, runWithSession, type Session } from "@primebrick/sdk";
import { JobTriggerEntity } from "../../domain/entities/job_trigger_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { ConfigEntryEntity } from "../../domain/entities/config_entry_entity.js";
import { callableSubjects, callablePayloadSchema, emitSubjects, emitDeclFor, subjectCoveredBy } from "../../services/callable-catalog.js";
import { resolveMapKeySchemas } from "../../services/map-key-schemas.js";
import { listJobScheduleSubjects } from "../../nats/schedule-mechanism.js";
import { scheduleDrift } from "../../services/schedule-drift.js";
import { jobTriggerMeta, jobScheduleMeta, jobRunMeta } from "./job.meta.js";

const TRIGGER_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };

export function publishTriggerChanged(uuid: unknown): void {
  if (typeof uuid !== "string") return;
  // Core pub/sub, not JetStream: `jobs.ctl.*` is the control plane and must
  // stay OUTSIDE the stream capture set (a stored subject would swallow
  // req/reply AND any syncSubjects re-ensure by another service strips it —
  // the publish then fails silently and the reload tap dies). A missed
  // event is harmless: boot reloads every enabled trigger anyway.
  NatsClient.publishEphemeralLossy("jobs.ctl.triggers.changed", { trigger_uuid: uuid }).catch((err) => {
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

/** Synthetic session carrying the caller-declared actor — the governed door
 *  for system-path writes: `svc` resolves `requireActor` from it exactly as
 *  an HTTP request resolves the real session, so the write gets hooks,
 *  audit and markers through the same pipeline as a wire write. */
const actorSession = (actor: string): Session => ({
  actor,
  roles: [],
  idpCode: null,
  idpOrg: null,
  idpUsername: null,
});

/** `"system"` / `"system:<code>"` writers — the hook branches on this to
 *  skip USER-facing immutability guards (system paths own those fields),
 *  while shape/conformance validation still runs for every writer. */
const isSystemActor = (actor: string): boolean => actor.startsWith("system");

export class JobTriggersService extends DomainService<TriggerT> {
  constructor() {
    super({
      entity: JobTriggerEntity,
      actor: requireActor,
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
      auditPort: (repo) => makeMarkerAuditPort(makeTableAuditPort(repo), "job_trigger"),
      hooks: {
        beforeCreate: async (body: Record<string, unknown>, ctx: { actor: string }) => {
          // USER wire writes may never set system_key and must pick
          // catalog-declared subjects; system paths (svc under a `system:*`
          // session) own system_key by construction and must NOT gate on
          // live-catalog liveness — a materialize cannot fail because the
          // callable's service is momentarily down. The pure shape
          // contract runs for every writer either way.
          if (!isSystemActor(ctx.actor)) {
            assertSystemTriggerMutable(body, true);
            await assertCallableTarget(body);
            await assertEmitSubject(body);
            await assertPayloadMapConformance(body);
          }
          await assertTriggerShape(body, true);
          return body;
        },
        beforeUpdate: async (uuid: string, body: Record<string, unknown>, ctx: { actor: string }) => {
          const loadExisting = async () => {
            const row = await this.svc.get(uuid);
            return row as Record<string, unknown> | undefined;
          };
          if (!isSystemActor(ctx.actor)) {
            assertSystemTriggerMutable(body, false, await loadExisting());
            await assertCallableTarget(body);
            await assertEmitSubject(body);
            await assertPayloadMapConformance(body, loadExisting);
          }
          await assertTriggerShape(body, false, loadExisting);
          return body;
        },
        afterWrite: async (_op: string, row: Record<string, unknown>) => { publishTriggerChanged(row.uuid as string); },
      },
    };
  }

  // ─── Domain queries — the owning service's surface for non-router
  // consumers (engine modules, action routes, system reconcile). ────────

  /** Single trigger by uuid — `includeDeleted` for paths that must see
   *  user-disabled rows (soft-delete IS the disable flag). */
  async findByUuid(uuid: string, opts?: { includeDeleted?: boolean }): Promise<TriggerT | undefined> {
    const rows = await this.svc.query<TriggerT>(null, {
      filters: [Filter.fieldValue(field(JobTriggerEntity, "uuid"), "=", uuid)],
      ...(opts?.includeDeleted ? { deletedRecords: "INCLUDED" as const } : {}),
    });
    return rows[0];
  }

  /** Row lookup by the reconcile anchor — deleted rows INCLUDED: a
   *  soft-deleted system trigger is user disablement, never silently
   *  resurrected. */
  async findBySystemKey(key: string): Promise<Record<string, unknown> | undefined> {
    const rows = await this.svc.query<TriggerT>(null, {
      filters: [Filter.fieldValue(field(JobTriggerEntity, "system_key"), "=", key)],
      deletedRecords: "INCLUDED",
    });
    return rows[0] as unknown as Record<string, unknown> | undefined;
  }

  /** Every live trigger — the engine's boot enumeration. Soft-deleted rows
   *  are excluded by default (`deleted_at` IS the disable flag). */
  async listLive(): Promise<TriggerT[]> {
    return this.svc.query<TriggerT>(null);
  }

  /** Flip soft-delete state — the wire-canonical path (svc): audit row +
   *  entity-changed marker + afterWrite publish all fire; the actor stamps
   *  through the configured `requireActor` supplier. */
  async setDeleted(uuid: string, version: number, deleted: boolean): Promise<void> {
    if (deleted) await this.svc.delete(uuid, version);
    else await this.svc.restore(uuid, version);
  }

  /** Materialize-insert a system trigger row — svc under the declared
   *  `system:*` session: the hook's system branch admits `system_key`,
   *  shape/conformance checks still run, audit + marker fire. */
  async insertSystemRow(row: Record<string, unknown>, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () => this.svc.create(row));
  }

  /** Optimistic-lock patch on code-owned fields — reconcile drift write,
   *  same governed path as `insertSystemRow`. */
  async patchRow(uuid: string, version: number, patch: Record<string, unknown>, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () => this.svc.update(uuid, { ...patch, version }));
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
      actor: requireActor,
      list: {
        meta: jobScheduleMeta,
        defaultSort: TRIGGER_DEFAULT_SORT,
      },
    });
  }

  // No auditPort: `job_schedules` is a derived mirror — NOT auditable
  // state by design (no @AuditTrail, no `{table}_audit`); svc writes are
  // unreachable anyway (the entity route declares it read-only).

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
    return this.svc.query<JobScheduleEntity>(null, {
      filters: [
        Filter.expr(
          { sql: "schedule_subject" },
          "=",
          { sql: "ANY(?)", params: [scheduleSubjects] },
        ),
      ],
    });
  }

  /** Single mirror row for a schedule subject — the canonical read every
   *  mirror mutation starts from (unique per subject). */
  async findBySubject(scheduleSubject: string): Promise<JobScheduleEntity | undefined> {
    const row = await this.svc.find<JobScheduleEntity>(null, {
      filters: [Filter.fieldValue(field(JobScheduleEntity, "schedule_subject"), "=", scheduleSubject)],
      throwIfNotFound: false,
    });
    return row ?? undefined;
  }

  /** Mirror rows whose status is in the given set — bulk suppress/resume. */
  async listByStatuses(statuses: string[]): Promise<JobScheduleEntity[]> {
    return this.svc.query<JobScheduleEntity>(null, {
      filters: [Filter.expr({ sql: "status" }, "IN", { sql: `(SELECT unnest(?::text[]))`, params: [statuses] })],
    });
  }

  /** Every mirror row — drift diagnostic + reconcile enumeration. */
  async listAllRows(): Promise<JobScheduleEntity[]> {
    return this.svc.query<JobScheduleEntity>(null, {});
  }

  /** Declare-time mirror insert — the row is born only when the NATS
   *  declaration is already live (the caller compensates on failure). */
  async insertMirror(row: Partial<JobScheduleEntity>, actor: string): Promise<JobScheduleEntity> {
    return (await runWithSession(actorSession(actor), () =>
      this.svc.create(row as Record<string, unknown>),
    )) as JobScheduleEntity;
  }

  /** Optimistic-lock patch on a mirror row — collapses disarm, unsuppress,
   *  reconcile heal/backfill, mark-fired and re-arm writes. */
  async patchRow(uuid: string, version: number, patch: Record<string, unknown>, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () => this.svc.update(uuid, { ...patch, version }));
  }

  /** Physical drop — the mirror is a derived artifact, not auditable
   *  state: a disarmed tombstone would list a schedule nobody can re-arm. */
  async dropMirror(uuid: string, version: number, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () => this.svc.purge(uuid, version));
  }
}

export class JobRunsService extends DomainService<RunT> {
  constructor() {
    super({
      entity: JobRunEntity,
      actor: requireActor,
      list: {
        meta: jobRunMeta,
        defaultSort: TRIGGER_DEFAULT_SORT,
      },
    });
  }

  // No auditPort: the run row IS the audit trail (entities-route.ts) —
  // no @AuditTrail, no `{table}_audit`; svc writes are unreachable anyway
  // (the entity route declares the surface read-only).

  /** Record a run row — dispatch insert or direct result insert. */
  async addRun(row: Partial<JobRunEntity>, actor: string): Promise<JobRunEntity> {
    return (await runWithSession(actorSession(actor), () =>
      this.svc.create(row as Record<string, unknown>),
    )) as JobRunEntity;
  }

  /** Single run by uuid — correlate/fail reads. */
  async findByUuid(uuid: string): Promise<JobRunEntity | undefined> {
    const row = await this.svc.get(uuid, { throwIfNotFound: false });
    return (row as JobRunEntity | null) ?? undefined;
  }

  /** Optimistic-lock patch — status flips, duration/report correlate,
   *  sweep-to-lost. */
  async patchRow(uuid: string, version: number, patch: Record<string, unknown>, actor: string): Promise<void> {
    await runWithSession(actorSession(actor), () => this.svc.update(uuid, { ...patch, version }));
  }

  /** Dispatched runs older than the cutoff — the lost-sweep source. */
  async listDispatchedBefore(cutoff: Date): Promise<JobRunEntity[]> {
    return this.svc.query<JobRunEntity>(null, {
      filters: [
        Filter.fieldValue(field(JobRunEntity, "status"), "=", "dispatched"),
        Filter.fieldValue(field(JobRunEntity, "created_at"), "<", cutoff),
      ],
    });
  }

  /** Bucketed outcome counts per schedule subject — the run-stats grid's
   *  data rows (group on the select alias: a parameterized date_trunc in
   *  GROUP BY binds a different `$n`, so Postgres would treat them as
   *  distinct expressions). */
  async statsBySchedule(unit: string, subjects: string[], spanMs: number): Promise<JobRunStatRow[]> {
    const rows = await this.svc.query<JobRunStatRow>(
      [
        Project.field(field(JobRunEntity, "schedule_subject")),
        Project.expr("date_trunc(?::text, created_at)", "bucket_start", [unit]),
        Project.expr("count(*) FILTER (WHERE status = 'succeeded')", "succeeded"),
        Project.expr("count(*) FILTER (WHERE status = 'failed')", "failed"),
        Project.expr("count(*) FILTER (WHERE status = 'skipped')", "skipped"),
        Project.expr("count(*) FILTER (WHERE status = 'lost')", "lost"),
        Project.expr("count(*) FILTER (WHERE status = 'dispatched')", "dispatched"),
      ],
      {
        filters: [
          Filter.expr(
            { sql: "schedule_subject" },
            "=",
            { sql: "ANY(?)", params: [subjects] },
          ),
          Filter.expr(
            { sql: "created_at" },
            ">=",
            { sql: "now() - make_interval(secs => ? / 1000.0)", params: [spanMs] },
          ),
        ],
        groupBy: [GroupBy.expr("bucket_start")],
        sorting: [Sort.byAlias("bucket_start")],
      },
    );
    return rows;
  }
}

/** The run-stats aggregate row shape — shared with the action route. */
export interface JobRunStatRow {
  schedule_subject: string;
  bucket_start: Date;
  succeeded: bigint;
  failed: bigint;
  skipped: bigint;
  lost: bigint;
  dispatched: bigint;
}

/**
 * `job.config_entries` — service-owned reads/writes for the config_entry
 * routes. Column projection + secret masking are DOMAIN shape (the BE's
 * ConfigEntriesService.maskSecretValue semantics): `type === "secret"`
 * never serializes a value.
 */
const configProjection = [
  Project.field(field(ConfigEntryEntity, "uuid")),
  Project.field(field(ConfigEntryEntity, "key")),
  Project.field(field(ConfigEntryEntity, "value")),
  Project.field(field(ConfigEntryEntity, "type")),
  Project.field(field(ConfigEntryEntity, "type_config")),
  Project.field(field(ConfigEntryEntity, "label_key")),
  Project.field(field(ConfigEntryEntity, "description_key")),
  Project.field(field(ConfigEntryEntity, "group_key")),
  Project.field(field(ConfigEntryEntity, "reserved")),
  // `version` is required on write (optimistic concurrency) — the FE must
  // receive it to send it back.
  Project.field(field(ConfigEntryEntity, "version")),
];

function maskSecretRow(row: ConfigEntryEntity): ConfigEntryEntity {
  return row.type === "secret" ? { ...row, value: null } : row;
}

type ConfigEntryT = ConfigEntryEntity & Record<string, unknown>;

export class ConfigEntriesService extends DomainService<ConfigEntryT> {
  constructor() {
    super({
      entity: ConfigEntryEntity,
      actor: requireActor,
      // No served entity meta — the config_entry routes are custom RPC.
      // Keys declared so a future list surface derives scope correctly.
      list: { searchableKeys: ["key"], filterableKeys: new Set(["key", "type", "reserved"]) },
    });
  }

  /** The static-identity-key guard lives in the write pipeline itself —
   *  every writer through svc hits it, not just `updateValue`'s call site. */
  protected override buildConfig(): EntityServiceConfig<ConfigEntryT> {
    return {
      ...super.buildConfig(),
      hooks: {
        beforeUpdate: async (uuid: string, body: Record<string, unknown>) => {
          const row = (await this.svc.get(uuid)) as { key?: string } | undefined;
          if (row?.key) assertWritableConfigKey(row.key);
          return body;
        },
      },
    };
  }

  /** All entries in the wire projection, secrets masked. */
  async listEntries(): Promise<ConfigEntryEntity[]> {
    const rows = await this.svc.query<ConfigEntryEntity>(configProjection);
    return rows.map(maskSecretRow);
  }

  /** Single entry by uuid in the wire projection, secrets masked. */
  async getEntry(uuid: string): Promise<ConfigEntryEntity | null> {
    const row = await this.svc.find<ConfigEntryEntity>(configProjection, {
      filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuid)],
      throwIfNotFound: false,
    });
    return row ? maskSecretRow(row) : null;
  }

  /** Write `value` with optimistic lock — internalizes the domain rules
   *  the route used to hold: 404 surface, static-identity keys rejected
   *  (`assertWritableConfigKey` — deployed-artifact identity, B3), and
   *  `type === "secret"` + empty value = "leave unchanged" (the FE sends
   *  the masked null back when no new secret was typed). Returns the
   *  re-read, masked row — `null` when the uuid is unknown. */
  async updateValue(uuid: string, body: { value: unknown; version: number }): Promise<ConfigEntryEntity | null> {
    const target = await this.svc.find<{ key?: string; type?: string }>([
      Project.field(field(ConfigEntryEntity, "key")),
      Project.field(field(ConfigEntryEntity, "type")),
    ], {
      filters: [Filter.fieldValue(field(ConfigEntryEntity, "uuid"), "=", uuid)],
      throwIfNotFound: false,
    });
    if (!target?.key) return null;
    assertWritableConfigKey(target.key);
    if (!(target.type === "secret" && (body.value === null || body.value === ""))) {
      // svc.update — ambient HTTP session supplies the actor; audit row +
      // marker fire, and the beforeUpdate hook re-checks the key guard
      // for every writer (not just this call site).
      await this.svc.update(uuid, { value: body.value as string, version: Number(body.version) });
    }
    return this.getEntry(uuid);
  }
}

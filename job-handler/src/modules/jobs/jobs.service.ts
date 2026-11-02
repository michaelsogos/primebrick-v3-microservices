/**
 * Entity-service facades over `makeEntityService` — thin, transport-free.
 * The NATS publish on job_rule writes lets a running instance reload its
 * rules engine without restart.
 */

import { type EntityService, ValidationError } from "@primebrick/dal-pg";
import { NatsClient, makeMarkerAuditPort } from "@primebrick/sdk";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";
import { JobRuleEntity } from "../../domain/entities/job_rule_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";
import { callableSubjects } from "../../services/callable-catalog.js";

const RULE_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };
const RUN_FILTERABLE = new Set(["status", "service_code", "job_name", "lane", "schedule_subject", "created_at", "updated_at"]);
const RULE_FILTERABLE = new Set(["name", "event_subject", "target_subject", "execution_context", "enabled"]);
const SCHEDULE_FILTERABLE = new Set(["service_code", "job_name", "kind", "lane", "status", "schedule_type", "schedule_subject"]);

function publishRuleChanged(uuid: unknown): void {
  if (typeof uuid !== "string") return;
  NatsClient.jetstreamPublish("jobs.ctl.rules.changed", { rule_uuid: uuid }).catch(() => {});
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

export class JobRulesService {
  private svc = getDal().entityService<JobRuleEntity & Record<string, unknown>>({
    entity: JobRuleEntity,
    actor: entityActor,
    // Collaboration: audit write + entity-changed marker on NATS — the
    // gateway persists markers to Redis (services own no Redis client).
    auditPort: makeMarkerAuditPort(getDal().tableAuditPort(), "job_rule"),
    list: {
      searchableKeys: new Set(["name", "event_subject", "target_subject"]),
      filterableKeys: RULE_FILTERABLE,
      defaultSort: RULE_DEFAULT_SORT,
    },
    hooks: {
      beforeCreate: async (body: Record<string, unknown>) => { await assertCallableTarget(body); return body; },
      beforeUpdate: async (_uuid: string, body: Record<string, unknown>) => { await assertCallableTarget(body); return body; },
      afterWrite: async (_op: string, row: Record<string, unknown>) => { publishRuleChanged(row.uuid as string); },
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
      defaultSort: RULE_DEFAULT_SORT,
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
      defaultSort: RULE_DEFAULT_SORT,
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

/**
 * Entity-service facades over `makeEntityService` — thin, transport-free.
 * The NATS publish on job_rule writes lets a running instance reload its
 * rules engine without restart.
 */

import { type EntityService } from "@primebrick/dal-pg";
import { NatsClient } from "@primebrick/sdk";
import { entityActor } from "../../db/entity-repo.js";
import { getDal } from "../../db/dal.js";
import { JobRuleEntity } from "../../domain/entities/job_rule_entity.js";
import { JobScheduleEntity } from "../../domain/entities/job_schedule_entity.js";
import { JobRunEntity } from "../../domain/entities/job_run_entity.js";

const RULE_DEFAULT_SORT = { key: "updated_at", dir: "desc" as const };
const RUN_FILTERABLE = new Set(["status", "service_code", "job_name", "lane", "schedule_subject", "created_at", "updated_at"]);
const RULE_FILTERABLE = new Set(["name", "event_subject", "target_subject", "execution_context", "enabled"]);
const SCHEDULE_FILTERABLE = new Set(["service_code", "job_name", "kind", "lane", "status", "schedule_type", "schedule_subject"]);

function publishRuleChanged(uuid: unknown): void {
  if (typeof uuid !== "string") return;
  NatsClient.jetstreamPublish("jobs.ctl.rules.changed", { rule_uuid: uuid }).catch(() => {});
}

export class JobRulesService {
  private svc = getDal().entityService<JobRuleEntity & Record<string, unknown>>({
    entity: JobRuleEntity,
    actor: entityActor,
    list: {
      searchableKeys: new Set(["name", "event_subject", "target_subject"]),
      filterableKeys: RULE_FILTERABLE,
      defaultSort: RULE_DEFAULT_SORT,
    },
    hooks: {
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

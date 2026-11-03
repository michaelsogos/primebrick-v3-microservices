/**
 * Register every @Entity class so database patch tooling can scan them.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { ConfigEntryEntity } from "./config_entry_entity.js";
import { JobScheduleEntity } from "./job_schedule_entity.js";
import { JobRunEntity } from "./job_run_entity.js";
import { JobTriggerEntity } from "./job_trigger_entity.js";

export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
  JobScheduleEntity,
  JobRunEntity,
  JobTriggerEntity,
] as const;

export {
  ConfigEntryEntity,
  JobScheduleEntity,
  JobRunEntity,
  JobTriggerEntity,
};
export type { EntityClass };

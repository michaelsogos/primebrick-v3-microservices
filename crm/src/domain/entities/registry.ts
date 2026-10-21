/**
 * Register every @Entity class so database patch tooling can scan them.
 */
import "reflect-metadata";

import type { EntityClass } from "@primebrick/dal-pg";
import { ConfigEntryEntity } from "./config_entry_entity.js";

// The crm.translations table is intentionally NOT in this registry: its CRUD
// is owned by the BE central translations gateway (service_registry
// discovery → <code>.translations), same contract as job.translations.
export const ENTITY_REGISTRY = [
  ConfigEntryEntity,
] as const;

export { ConfigEntryEntity };
export type { EntityClass };
